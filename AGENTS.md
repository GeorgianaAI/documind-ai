# DocuMind AI | Architecture & Governance

## 1. Project Intent

DocuMind AI is a RAG-native PDF intelligence platform. Users upload PDFs which are chunked, embedded, and stored in a session-scoped in-memory vector store. Grounded, streaming answers are returned by GPT-4o-mini using the top-3 semantically relevant chunks, with clickable source pills exposing the evidence behind every response.

## 2. Technical Stack

- **Framework:** Next.js 16 (App Router + React 19)
- **UI:** Tailwind CSS v4 + Shadcn/UI (Radix Nova theme)
- **AI Orchestration:** LangChain.js + Vercel AI SDK
- **LLM & Embeddings:** OpenAI `gpt-4o-mini` + `text-embedding-3-small`
- **Vector Store:** Custom in-memory cosine-similarity store (session-scoped, no persistence)
- **PDF Parsing:** `pdf2json` (server-side text extraction)
- **Validation:** Zod (API boundary contracts)
- **Testing:** Vitest (unit/logic) + React Testing Library
- **Deployment:** Vercel

## 3. Denied Permission to Secret File Access

Hard rule: **never** read, search, open, cat, grep, ripgrep, summarize, or inspect real secret-bearing files **under any circumstance** unless the user explicitly overrides this rule for the current task. This includes `.env`, `.env.local`, `.env.development`, `.env.production`, `.env.test`, any other real secret `.env.*` variants, `*.pem`, `*.key`, and `~/.ssh/**`. If a task requires knowing which keys or variables exist, read `.env.example` only. If a task appears to require actual secret values from a real env file, stop and ask the user instead of accessing that file.
