# DocuMindAI | Architecture & Governance

## 1. Project Intent

DocuMindAI is a RAG-native PDF intelligence platform. Users upload PDFs which are chunked, embedded, and stored in a session-scoped in-memory vector store. Grounded, streaming answers are returned by GPT-4o-mini using the top-3 semantically relevant chunks, with clickable source pills exposing the evidence behind every response.

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

## 2.1 Version Governance & Stability Lock

**Strict Version Policy:** This project is locked to **Next.js 16** and **React 19.2.3**. Do not upgrade without an explicit decision from the Architect.

- **Reason:** The codebase is built and tested on these versions. An upgrade mid-project introduces churn with no concrete benefit.
- **Constraint:** All new code must use React 19 patterns. If an "upgrade available" notice appears, ignore it.
- **Vitest & coverage:** `vitest` and `@vitest/coverage-v8` must always be on the **same major version**. Never bump one without bumping the other.

## 3. Development Workflow

- **Feature Branches:** Prefix with `feat/`, `fix/`, or `refactor/`.
- **Atomic Commits:** Group changed files meaningfully; create several commits per feature. Separate concerns:
  1. Architecture / config / governance files
  2. Route scaffolding (new pages, layouts)
  3. UI / layout components
  4. API routes and service logic
  5. Tests
- **Commit Metadata:** Never include "Co-authored-by: Claude", "Co-Authored-By:", or any AI attribution tags in commit messages.
  - **How to apply:** Write all commit messages without any trailing attribution lines. This applies to every commit, on every branch, always.
- **No Merges:** Pushing to remote is encouraged, but merging is restricted to the Architect.
- **Branch Hygiene Gate:** Before creating any new branch, run `git branch` and check for unmerged feature branches. If any exist, stop and alert the Architect. List the unmerged branches and wait for explicit confirmation before proceeding.
- **Modular Architecture:**
  - If a component or file exceeds approximately 200 lines, extract logic into co-located flat files within the same directory (e.g., `constants.ts`, `types.ts`, `helpers.ts`).
  - Keep RAG/AI/PDF logic (Services) out of the UI (Components). Use API Route Handlers for pipeline execution and maintain clean, declarative JSX.

## 4. Denied Permission to Secret File Access

Hard rule: **never** read, search, open, cat, grep, ripgrep, summarize, or inspect real secret-bearing files **under any circumstance** unless the user explicitly overrides this rule for the current task. This includes `.env`, `.env.local`, `.env.development`, `.env.production`, `.env.test`, any other real secret `.env.*` variants, `*.pem`, `*.key`, and `~/.ssh/**`. If a task requires knowing which keys or variables exist, read `.env.example` only. If a task appears to require actual secret values from a real env file, stop and ask the user instead of accessing that file.

## 5. Code Layout & Architecture

Maintain thin entrypoints. Logic must be extracted once a file exceeds approx. 200 lines.

### Directory Mapping

| Area                                | Purpose                                                                                            |
| :---------------------------------- | :------------------------------------------------------------------------------------------------- |
| `src/app/`                          | **Routing Only:** `page.tsx`, `layout.tsx`. Minimal logic.                                         |
| `src/app/workspace/`                | **RAG Shell Route:** The live PDF-upload + chat workspace.                                         |
| `src/app/api/chat/route.ts`         | **Chat Route:** LangChain retrieval pipeline + GPT-4o-mini streaming.                              |
| `src/app/api/chat/sources/route.ts` | **Sources Route:** Returns top-3 relevant chunks for citation pills.                               |
| `src/app/api/rag/ingest/route.ts`   | **Ingestion Route:** PDF parsing, chunking, embedding, session-store upsert.                       |
| `src/components/`                   | **Feature Components:** `chat-interface.tsx`, `pdf-uploader.tsx`.                                  |
| `src/components/ui/`                | **Primitives:** Shadcn/UI base components (`button`, `card`, `input`, `scroll-area`, `use-toast`). |
| `src/lib/ai/rag-engine.ts`          | **RAG Engine:** PDF text extraction, chunking, embedding, cosine retrieval.                        |
| `src/lib/utils.ts`                  | **Glue:** `cn()` and shared formatting utilities.                                                  |
| `src/hooks/use-session-id.ts`       | **State:** Session UUID hook — single source of truth for in-memory store scoping.                 |
| `src/test/setup.ts`                 | **Test bootstrap:** Vitest + Testing Library DOM setup.                                            |

### Naming Conventions

- **Markdown Files:** All `.md` files must have **ALL_CAPS** names (e.g., `README.md`, `CLAUDE.md`). Extension stays lowercase.
- **React Hooks:** Use **camelCase** for hook filenames (e.g., `use-session-id.ts`).
- **API Routes:** All route handlers live in `src/app/api/[domain]/[action]/route.ts`.

### TypeScript Strictness

`tsconfig.json` has `"strict": true`. Maintain that posture:

- **No `any` types:** Use `unknown` with a type guard, explicit interfaces, or `Record<string, unknown>`.
- **Explicit `useState` generics:** Always annotate state — e.g., `useState<boolean>(false)`, `useState<RetrievedChunk[]>([])`.
- **Explicit `useRef` generics:** Always annotate — e.g., `useRef<HTMLDivElement>(null)`.

### Architectural Rules

- **Path Aliases:** Strictly use `@/*` for all internal imports (e.g., `import { cn } from "@/lib/utils"`).
- **Server-First:** Prioritise Route Handlers over client-side fetching for all AI/RAG work — keep API keys off the client.
- **Session Isolation:** All in-memory vector operations must target the session-scoped store. Never read or mutate across sessions.
- **Validation at Boundaries Only:** Zod schemas enforce contracts at API routes. Do not re-validate data already inside the trusted pipeline.
- **Chunking is authoritative:** The 1,000-character / 200-character overlap chunking in `rag-engine.ts` is the retrieval contract. Do not change these values without updating the corresponding tests.

## 5.1 UI Consistency & Radix Nova Theme

Strict adherence to the Shadcn/UI Radix Nova aesthetic is mandatory.

- **Component Reuse:** Prioritise existing Shadcn primitives in `src/components/ui/`. If a bespoke pattern is used more than twice, extract it into a reusable component.
- **Tailwind v4:** Use CSS variables and the `cn()` utility from `@/lib/utils`. Do not use deprecated Tailwind v3 patterns.
- **Color Discipline:**
  - **Sky blue:** Primary interactive elements, upload actions, AI indicators.
  - **Violet:** Chat/AI response surfaces, streaming indicators.
  - **Emerald/Green:** Successful ingestion, session-ready confirmations.
  - **Amber/Yellow:** Warnings, loading states, processing indicators.
  - **Slate neutrals:** Backgrounds, cards, borders, muted text.

## 6. Testing Invariants

These invariants must not be weakened by any change:

1. **RAG Engine:** Any change to chunking logic, embedding calls, or cosine retrieval requires a corresponding Vitest unit test update.
2. **API Contracts:** All new route handlers must validate input with Zod before touching the RAG engine.
3. **Version Parity:** `vitest` and `@vitest/coverage-v8` must always share the same major version in `package.json`.
4. **Session Guard:** The `sessionId` guard at the top of each API handler is the first line of defence against cross-session contamination. Never remove it.

## 7. Operational Commands

```bash
# Development
npm run dev           # Start Next.js dev server

# Code Quality
npm run lint          # ESLint (src/**/*.{ts,tsx})
npm run type-check    # TypeScript strict check (no emit)

# Unit & Logic Tests (Vitest)
npm run test          # Run all unit tests once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report (coverage/)

# Security
npm run audit:high    # npm audit at high severity level

# Production build
npm run build
npm start
```
