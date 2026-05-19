# ⚙️ DocuMind AI | Technical Advisory

This document captures architectural challenges, tradeoffs, and the reasoning behind key technical decisions in DocuMind AI. Each entry describes the problem, the options considered, and the chosen path — so future contributors understand not just what was decided, but why.

## Update Rules

Add an entry to this file when:

- A significant architectural decision was made between two or more real options.
- A known limitation was accepted intentionally (not just overlooked).
- A past decision was reversed and the reason matters for future contributors.
- A significant bug was found and fixed, and the root cause is worth remembering.

Do not add entries for routine implementation choices. Challenges, tradeoffs, and significant fixes only.

---

## 1. In-Memory Vector Store vs. Upstash Vector

### The Problem

DocuMind AI's RAG engine stores embeddings in a server-side `Map<SessionId, SessionStore>` held in `globalThis` (see `src/lib/ai/rag-engine.ts`). This works correctly in local development because the Node.js process is long-lived — the `globalThis` singleton persists across requests, so a PDF ingested in one request is still available when the chat route fires in the next.

On Vercel, this breaks silently.

Vercel deploys each API route as an independent serverless function. These functions are stateless and ephemeral — they spin up per request and are destroyed afterward. More critically, **Vercel does not guarantee that two requests from the same user will land on the same function instance.** This means:

- `POST /api/rag/ingest` writes vectors into the `globalThis` Map on Function Instance A.
- `POST /api/chat` fires on Function Instance B — a cold, empty Map.
- The retrieval call returns zero chunks. The model responds with "I don't know."
- No error is thrown. The user sees a correct-looking response with no evidence it is groundless.

The `globalThis` pattern was added to survive Next.js **hot reloads** in development (where the module cache resets but the Node process stays alive). It does not help with Vercel's multi-instance model at all.

### Why This Is Hard to Detect

The failure is silent and environment-dependent. Local testing always passes. The live demo appears to work — the UI renders, streaming works, source pills appear — but the answers are hallucinated from the model's training data rather than the uploaded document. Only running the Neon Pink Moon grounding test against the deployed URL would expose it.

### Options Considered

| Option                  | Pros                                                                                       | Cons                                                                                                                            |
| :---------------------- | :----------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| **Keep in-memory**      | Zero infra cost, zero latency, simple code                                                 | Broken on Vercel. Not suitable for production.                                                                                  |
| **Upstash Vector**      | Persistent, serverless-safe, namespace isolation maps 1:1 to sessionId, generous free tier | Adds network round-trips (~20–50ms per query), requires account + env vars, vectors survive session end (needs TTL strategy)    |
| **Pinecone / Weaviate** | Enterprise-grade                                                                           | Overkill for a single-index session-scoped use case, cost and complexity far exceed the need                                    |
| **Vercel KV / Blob**    | Native to Vercel                                                                           | Not a vector store — would require storing raw embeddings as JSON blobs and re-implementing cosine search, negating any benefit |

### Decision

**Migrate to Upstash Vector.** It is the minimal viable fix that preserves the session-scoped isolation model, requires no changes to chunking or embedding logic, and solves the Vercel stateless problem completely.

The migration is contained entirely to `src/lib/ai/rag-engine.ts`:

- `sessionStores.set(sessionId, ...)` → `index.upsert(vectors, { namespace: sessionId })`
- `sessionStores.get(sessionId)` → `index.query(queryVector, { namespace: sessionId, topK: 3, includeMetadata: true })`
- Chunk text travels as vector metadata (`{ text: chunk }`)
- The `rawText` field on `SessionStore` is dropped — nothing in the pipeline uses it

The `cosineSimilarity` function can also be dropped — Upstash handles ranking internally.

### Outstanding Tradeoffs After Migration

- **Latency:** Each ingest and retrieval call adds a network round-trip to Upstash (~20–50ms). Acceptable for this use case; the dominant latency is OpenAI embedding + GPT-4o-mini generation.
- **Vector persistence:** Upstash does not auto-expire namespaces. Vectors from old sessions accumulate. A TTL strategy or periodic cleanup job is needed at scale — not a concern for the current usage volume, but worth tracking.
- **Cold embeddings:** The `globalThis` singleton also cached raw chunk text for potential reuse. After migration, chunk text is only accessible as metadata on retrieved vectors. Re-embedding an already-ingested document requires re-uploading.

### Status

✅ **Implemented.** `rag-engine.ts` migrated to Upstash Vector:

- In-memory `sessionStores` Map, `cosineSimilarity` function, and `globalThis` singleton removed.
- Vectors upserted to Upstash with `namespace: sessionId` for session isolation.
- Chunk text stored as vector metadata (`{ text: chunk }`), typed via `Index<ChunkMetadata>`.
- `UPSTASH_VECTOR_REST_URL` and `UPSTASH_VECTOR_REST_TOKEN` added to `.env.example`.
- Index configured on Upstash console: Dense type, 1536 dimensions (`text-embedding-3-small`), Cosine metric.

---

## 2. Upstash Vector: Key Operations and Concepts

### Cosine Similarity — What It Is and Why We No Longer Own It

**What it is:** Cosine similarity measures the angle between two vectors in high-dimensional space. A score of `1` means the vectors point in exactly the same direction (semantically identical); `0` means unrelated; `-1` means opposite. It is the standard metric for comparing text embeddings because it captures semantic meaning regardless of vector magnitude.

**Why the original code needed it:** The in-memory store held raw embedding arrays (`number[][]`). When a query came in, `rag-engine.ts` embedded the query, then manually looped over every stored chunk vector, computed cosine similarity against each one, sorted the results, and sliced the top-k. This was correct but meant DocuMind AI was running its own vector search engine — single-threaded, in Node.js, on every request.

**Why Upstash replaces it:** When the Upstash index was created with **Metric: COSINE**, Upstash took ownership of the ranking logic. A single `index.query({ vector, topK })` call now does the cosine math server-side across all stored vectors in the namespace and returns pre-ranked results. The custom `cosineSimilarity` function in `rag-engine.ts` was deleted — keeping it would mean doing the same computation twice. Upstash's implementation is also purpose-built for vector search, running on optimized infrastructure rather than a general-purpose JS runtime.

The `score > 0` filter is still applied in `retrieveRelevantChunks` on the returned results to exclude any zero-similarity chunks before building the context string.

---

### Upsert — What It Means and Why It's Used Here

**Definition:** Upsert = **update or insert**. If a vector with the given ID already exists in the index, it is overwritten. If it does not exist, it is created. It is the combination of a write that never fails due to a pre-existing record (unlike a pure insert) and never silently does nothing on a missing record (unlike a pure update).

**Why it's the right operation here:** Each chunk is stored with the ID `{sessionId}-{chunkIndex}`. If a user re-uploads the same PDF — or a revised version — the ingest route runs again and upserts the same set of IDs. The old vectors are replaced cleanly, and the session namespace reflects the latest document without requiring a delete-then-insert cycle. Using a plain insert here would cause duplicate-key errors on re-upload; using a delete-first approach would introduce a window where the namespace is empty and a concurrent chat request would retrieve nothing.

---

## 3. PDF Library Selection — DOMMatrix Server-Side Conflict

### The Problem

Standard PDF parsing libraries (notably `pdf-parse`) depend on browser-only Canvas APIs at import time. In Next.js 16 server environments this surfaces as a hard crash:

```
ReferenceError: DOMMatrix is not defined
```

The error fires during module initialization, before any PDF is even passed to the parser, making it impossible to recover from at runtime.

### Decision

**Use `pdf2json` in text-only mode.** `pdf2json` is a pure-Node parser that does not touch Canvas. Passing `true` as the second constructor argument (`new PDFParser(null, true)`) enables text-only mode and strips all rendering paths. No `globalThis` polyfills are needed.

`pdf-parse` was ruled out: its Canvas dependency is structural, not optional. Polyfilling `DOMMatrix` globally is fragile and breaks other Next.js internals that expect the real DOM API to be absent in server contexts.

### Status

✅ **Implemented.** `rag-engine.ts` uses `pdf2json` with `pdfParser.parseBuffer(buffer)` and `pdfParser.getRawTextContent()`. No Canvas polyfills in the codebase.

---

## 4. Streaming Protocol Alignment — Empty UI Despite 200 Responses

### The Problem

The Vercel AI SDK's `useCompletion` hook expects a specific data stream protocol on the client. When the server returns a raw `text/plain` stream without the correct headers, the hook receives the response but renders nothing — the UI stays blank even though the network tab shows a 200 with content.

### Decision

Two changes are required together — neither alone is sufficient:

- **Server:** Return `result.toTextStreamResponse()` with `"x-vercel-ai-data-stream": "v1"` and `"Content-Type": "text/plain; charset=utf-8"` headers.
- **Client:** Configure `useCompletion` with `streamProtocol: "text"`.

Mismatching either side produces the silent empty-UI failure. This is not surfaced as an error by the SDK.

### Status

✅ **Implemented.** Both sides aligned in `src/app/api/chat/route.ts` and `src/components/chat-interface.tsx`.

---

## 5. Chunking Strategy — The Sliding-Window Approach

### The Problem

Passing an entire PDF as a single string to the LLM has two failure modes:

1. **Cost:** Full-document prompts consume far more tokens per query than necessary.
2. **Lost-in-the-middle:** LLMs lose accuracy on content that appears in the middle of very long context windows. Retrieval quality degrades as document length grows.

### Decision

**Sliding-window chunking** with 1,000-character chunks and 200-character overlap (`chunkText` in `rag-engine.ts`). The 200-character overlap ensures that a sentence split across a chunk boundary is fully represented in at least one chunk, preserving semantic continuity for the embedder.

This contract is enforced by tests — changing either constant without updating the corresponding Vitest test is a CI failure.

### Status

✅ **Implemented.** `chunkText(text, 1000, 200)` in `src/lib/ai/rag-engine.ts`. Per the chunking contract in CLAUDE.md, any change to chunk size or overlap must include a corresponding Vitest test update.
