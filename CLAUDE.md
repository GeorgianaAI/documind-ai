# DocuMind AI | Architecture & Governance

## 1. Project Intent

DocuMind AI is a RAG-native PDF intelligence platform. Users upload PDFs, which are chunked, embedded, and stored in Upstash Vector under a session-scoped namespace. Grounded, streaming answers are returned by GPT-4o-mini using the top-3 semantically relevant chunks, with source pills exposing the evidence behind every response. See [Architecture reference](memory) for full context.

## 2. Technical Stack

See [Tech Stack reference](memory) for full dependency list and version details.

**Next.js 16** App Router, **React 19**, TypeScript strict, **Tailwind CSS 4**, Shadcn/UI (Radix Nova theme), LangChain.js, Vercel AI SDK, **Zod** (API boundary validation), **pdf2json** (server-side PDF parsing), Vitest + React Testing Library. Deployed on Vercel.

## 2.1 Version Governance

Locked to Next.js 16 and React 19.2.3. Never upgrade without explicit Architect decision. `vitest` and `@vitest/coverage-v8` must always share the same major version — never bump one without the other.

## 3. Development Workflow

### Branching & Commits

- `feat/`, `fix/`, `refactor/` branches for all code changes.
- No merges — merging restricted to Architect.
- **Branch Hygiene Gate:** Before creating any branch, run `git branch --merged main`. If any unmerged feature branches exist, stop and alert the Architect.
- Atomic commits grouped by concern: config/governance, routes, UI components, services, tests.
- **No AI tags** in commit messages (`Co-authored-by: Claude` etc. — never).

### Code Quality

- File size limit: ~200 lines. Extract logic into co-located flat files (`constants.ts`, `types.ts`, `helpers.ts`).
- RAG/AI/PDF logic stays in API Route Handlers. Keep JSX declarative — no pipeline logic in components.
- **No repeated UI patterns.** Check `src/components/ui/` before writing any button, card, or layout block inline. If a pattern appears more than twice, extract it as a reusable component.

### Naming

- Markdown: ALL_CAPS. React hooks: camelCase. Components: PascalCase.
- API Routes: `src/app/api/[domain]/[action]/route.ts`.

### TypeScript Strictness

No `any`. Use `unknown` with type guards, explicit interfaces, or `Record<string, unknown>`. Explicit generics: `useState<boolean>(false)`, `useRef<HTMLDivElement>(null)`.

## 4. App Structure

See [Architecture reference](memory) for the full directory map and file responsibilities.

`src/app/` (routing only) · `src/app/workspace/` (RAG shell) · `src/app/api/chat/` + `src/app/api/chat/sources/` + `src/app/api/rag/ingest/` (API routes) · `src/components/` (feature components) · `src/components/ui/` (Shadcn primitives: `button`, `card`, `input`, `pill`, `scroll-area`, `use-toast`) · `src/lib/ai/rag-engine.ts` (RAG engine) · `src/hooks/use-session-id.ts` (session state) · `src/lib/utils.ts` (`cn()`) · `src/lib/utils.test.ts` (unit tests) · `src/test/setup.ts` (Vitest bootstrap).

## 5. Architectural Rules

- **Path Aliases:** `@/*` for all internal imports.
- **Server-First:** All AI/RAG calls happen in Route Handlers. API keys never reach the client.
- **Session Guard:** All API handlers require a non-empty `sessionId` and return 400 if absent. Never remove this guard — it is the first line of defence against cross-session contamination.
- **Zod at every boundary:** All route handlers validate input with Zod before touching the RAG engine. Never re-validate data already inside the trusted pipeline.
- **Chunking contract:** 1,000-character chunks / 200-character overlap in `rag-engine.ts`. Do not change without updating the corresponding tests.

## 6. Testing Invariants

- Any change to chunking, embedding, or cosine retrieval → update the corresponding Vitest unit test.
- All new route handlers: Zod validation before RAG engine access.
- `vitest` and `@vitest/coverage-v8` must share the same major version in `package.json`.
- Never remove the `sessionId` guard from API handlers.

## 7. UI Theme

Dark slate + Radix Nova. `globals.css` is the source of truth for CSS variables. Use `cn()` from `@/lib/utils`.

**Color discipline:** Sky blue (interactive/upload) · Violet (AI surfaces) · Emerald (success/ingestion) · Amber (warnings/loading) · Slate neutrals (backgrounds, borders, muted text).

## 8. Denied Permission to Secret File Access

Hard rule: **never** read, search, open, cat, grep, ripgrep, summarize, or inspect real secret-bearing files **under any circumstance** unless the user explicitly overrides this rule for the current task. This includes `.env`, `.env.local`, `.env.development`, `.env.production`, `.env.test`, any other `.env.*` variants, `*.pem`, `*.key`, and `~/.ssh/**`. Read `.env.example` only. If actual secret values are needed, stop and ask.

## 9. Operational Commands

```bash
npm run dev           # Next.js dev server
npm run lint          # ESLint
npm run type-check    # TypeScript strict check
npm run test          # Vitest — all tests, once
npm run test:watch    # Vitest watch mode
npm run test:coverage # Coverage report (coverage/)
npm run audit:high    # npm audit at high severity
npm run build && npm start  # Production build + serve
```

## 10. Context & Memory

Memory files live in the Claude memory system. Load by task:

- **Before changing RAG logic:** Architecture reference (chunking contract, retrieval flow, session store)
- **Before adding UI components:** Architecture reference (directory map, Shadcn primitives list)
- **Before adding routes:** Architecture reference (Zod validation pattern, session guard)
- **Tech Stack details:** Tech Stack reference (full dependency versions, install commands)
