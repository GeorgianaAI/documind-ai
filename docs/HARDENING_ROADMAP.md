# 🧱 DocuMind AI Hardening Roadmap

## Purpose

This document defines pragmatic hardening steps for DocuMind AI across 7 core AI engineering skills.

DocuMind is intentionally a **lean, evidence-first RAG shell** for PDF Q&A.  
This roadmap improves reliability and trust without converting it into a full governance/security platform.

---

## Scope and Positioning

DocuMind AI focuses on:

- fast, grounded PDF chat
- source transparency via citations/source pills
- low-friction developer experience
- session-scoped privacy through Upstash Vector namespace isolation

It does **not** aim (in this repo) to become a full enterprise governance product.

Legend:

- **Implemented**: already present in DocuMind
- **Planned**: near-term hardening with high value / low complexity
- **Deferred**: recognized but intentionally out of scope for DocuMind DNA

---

## 7-Skill Maturity Snapshot

### 1) System Design

- **Status:** Implemented (Strong foundation)
- **Evidence:** Clear ingest → chunk → embed → upsert → retrieve → answer flow, API-route boundaries, session-scoped Upstash Vector namespace isolation.

### 2) Tool and Contract Design

- **Status:** Implemented (Strong), Planned (Error shape standardization)
- **Evidence:** Zod schemas enforced at all three route boundaries (`/api/chat`, `/api/chat/sources`, `/api/rag/ingest`). Missing or invalid `sessionId` returns `400` — no silent fallbacks. Input shape validated before any RAG engine access.
- **Gap:** Error payloads are not yet fully standardized across all routes — no consistent `{ errorCode, message, requestId }` shape or request correlation IDs.

### 3) Retrieval Engineering

- **Status:** Implemented (Core), Planned (Quality tuning)
- **Evidence:** Deterministic chunking (1000/200), embeddings, cosine similarity retrieval, top-k context grounding, source pills.
- **Gap:** Retrieval quality metrics and threshold tuning are still manual.

### 4) Reliability Engineering

- **Status:** Implemented (Baseline), Planned (Minimal production baseline), Deferred (Advanced SRE)
- **Evidence today:** Stable local flow, streaming response path, basic failure handling.
- **Gap:** Missing explicit health endpoint, request correlation IDs, and reliability targets.

### 5) Security and Safety

- **Status:** Implemented (Good baseline), Planned (Further hardening), Deferred (Enterprise controls)
- **Evidence today:** Context-bounded answering behavior, session isolation, server-side key usage, Upstash Redis rate limiting (2 chat turns per IP per day, sliding window) on `/api/chat`.
- **Gap:** No file size/type enforcement on ingest, no formal auth/RBAC/tenant isolation stack.

### 6) Evaluation and Observability

- **Status:** Implemented (Manual verification), Planned (Structured evals), Deferred (full telemetry suite)
- **Evidence today:** Neon Pink Moon grounding test pattern, retrieval logging during development.
- **Gap:** No automated eval harness or trace dashboards in this repo.

### 7) Product Thinking

- **Status:** Implemented (Strong core framing), Planned (Light packaging clarity), Deferred (full product analytics)
- **Evidence today:** Clear value proposition: grounded answers + source visibility.
- **Gap:** No formal ICP/JTBD matrix, no instrumentation for product outcomes.

---

## Detailed Hardening Plan: Skill 4 (Reliability Engineering)

## Objectives

- reduce fragile failure modes
- improve debug speed
- keep operations lightweight and developer-friendly

### Planned (Near-Term Minimal Baseline)

1. **Add `/api/health` endpoint**
   - service up/down status
   - basic readiness signals (embedding provider configured, runtime healthy)

2. **Standardize API error shape**
   - use a consistent schema:
     - `{ errorCode, message, requestId }`
   - apply across ingest/chat/sources routes

3. **Request correlation IDs**
   - generate `requestId` per request
   - include in server logs and error responses
   - surface in client toast for faster debugging

4. **Timeout and failure boundaries**
   - explicit timeout for upstream LLM/embedding calls
   - clear fallback message for retrieval-empty vs upstream-failure cases

### Deferred (Recognized, Out of Current Scope)

- circuit-breaker style dependency protection
- SLO/error-budget program
- incident automation and full alerting stack
- reliability dashboarding and p95 tracking infrastructure

### Reliability Exit Criteria (DocuMind Scope)

- `/api/health` exists and is documented
- key API routes return standardized errors with `requestId`
- logs can correlate ingest and chat failures quickly
- timeout/fallback behavior is deterministic for main failure classes

---

## Detailed Hardening Plan: Skill 6 (Evaluation and Observability)

## Objectives

- move from ad-hoc checks to repeatable evaluation
- make retrieval and grounding quality measurable
- preserve DocuMind simplicity

### Planned (Near-Term)

1. **LangSmith tracing**
   - Add `LANGCHAIN_TRACING_V2=true`, `LANGCHAIN_API_KEY`, `LANGSMITH_PROJECT` env vars
   - Auto-traces all `@langchain/openai` calls (embedDocuments, embedQuery) with zero code changes
   - Each trace captures: query → embedding latency → Upstash chunk scores → context built → response latency
   - Note: Vercel AI SDK (`streamText`) is not LangChain — the GPT-4o-mini generation step requires manual wrapping to appear in traces
   - Developer-facing only — no UI changes. Traces live in the LangSmith dashboard (smith.langchain.com)

2. **Codify baseline eval set in LangSmith**
   - Formalise Neon Pink Moon grounding tests as a LangSmith dataset
   - Add “answer should be I don’t know” negative cases
   - Run evals on demand against the deployed endpoint

3. **Define minimal retrieval metrics**
   - Retrieval hit rate (did top-k include expected chunk)
   - Grounded answer rate
   - Abstention correctness (unknown when context absent)

4. **Structured logs for core events**
   - Ingest complete: chunk count, processing time
   - Retrieval: query, top-k ids/scores
   - Generation: response latency, error class

### Deferred

- LLM-as-a-judge automated scoring pipelines
- Continuous eval automation on every deployment

### Evaluation Exit Criteria (DocuMind Scope)

- baseline eval file exists and is runnable
- at least 3 core metrics are recorded for local/dev runs
- known regressions in retrieval grounding can be detected quickly

---

## Detailed Hardening Plan: Skill 5 (Security and Safety)

## Objectives

- improve safe defaults without heavy enterprise overhead
- prevent obvious abuse/misuse paths
- keep local-first developer velocity

### Planned (Near-Term)

1. **Input/file safety checks**
   - enforce file type/size/page count limits
   - reject malformed uploads with clear errors

2. **Prompt and context safety hardening**
   - stricter system prompt for context-only answering
   - explicit handling for empty/low-confidence retrieval

3. **Light rate limiting at route layer** ✅ Implemented
   - Upstash Redis sliding window: 2 chat turns per IP per day on `/api/chat`

4. **Secrets and environment hygiene**
   - startup checks for required env vars
   - fail fast on missing keys with actionable messages

### Deferred

- full auth/RBAC/SSO stack
- tenant-grade isolation controls
- DLP-class redaction pipelines
- enterprise compliance evidence workflows

### Security Exit Criteria (DocuMind Scope)

- upload constraints are enforced
- low-context queries degrade safely
- basic route throttling prevents accidental abuse
- startup fails clearly when critical secrets are missing

---

## Detailed Hardening Plan: Skill 7 (Product Thinking)

## Objectives

- keep DocuMind’s identity clear vs Sentinel
- express capability boundaries honestly
- improve user trust and first-run success

### Planned (Near-Term)

1. **Clarify product boundary in README/UI** ✅ Implemented
   - DocuMind = lean, session-scoped RAG reference product
   - README infrastructure warning replaced with accurate deployment note
   - Sentinel reference updated to reflect its role as the production-grade evolution

2. **Improve trust UX copy**
   - clearer “why no answer” messaging
   - clearer source-pill explanation and limits

3. **Define minimal success metrics**
   - time-to-first-grounded-answer
   - ingest success rate
   - source-pill attach rate

### Deferred

- pricing/packaging tiers
- advanced persona-based workflows
- commercial analytics stack

### Product Exit Criteria (DocuMind Scope)

- README and UI communicate scope and limitations clearly
- first-run flow reduces confusion on ingestion/chat readiness
- 2-3 practical product metrics are tracked in dev/testing reports

---

## Current Intentional Non-Goals

To preserve DocuMind DNA and avoid scope creep, these are deferred:

- enterprise auth stack (SSO/SAML/RBAC depth)
- multi-tenant cloud memory architecture (vectors are now persistent via Upstash, but single-session scoped — not multi-tenant)
- full governance dashboard program
- advanced reliability/SRE platforming
- heavy productization and monetization layers

---

## Sequencing Rationale

DocuMind hardening order:

1. **Reliability baseline** (health, errors, requestId, timeouts)
2. **Evaluation baseline** (repeatable grounding tests + metrics)
3. **Security baseline** (file/input constraints + light throttling)
4. **Product clarity** (scope messaging + trust UX)

This sequence improves trust and operability while keeping DocuMind lightweight and fast to iterate.

---

## Document Status

This roadmap reflects the intended hardening scope for DocuMind AI as a lean RAG reference implementation.

It distinguishes:

- what is already implemented,
- what is planned next for practical hardening,
- what is intentionally deferred to avoid becoming Sentinel.
