import { ArrowLeft, Brain, FileText, MessageCircle } from "lucide-react";

import { AmbientGlow } from "@/components/ui/ambient-glow";
import { NavPill } from "@/components/ui/nav-pill";
import { Pill } from "@/components/ui/pill";

import { PDFUploader } from "@/components/pdf-uploader";
import { ChatInterface } from "@/components/chat-interface";

export default function WorkspacePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e293b,transparent_55%),radial-gradient(circle_at_bottom,#020617,#020617)] text-foreground">

      <AmbientGlow />
      <main className="relative z-10 flex min-h-screen max-w-6xl flex-col gap-8 ml-32 px-4 py-10 md:py-12">
        <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium shadow-sm backdrop-blur-xl dark:bg-slate-900/40">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40">
              <Brain className="size-3.5" />
            </span>
            <span className="text-sky-100/80">DocuMind AI</span>
            <span className="h-1 w-1 rounded-full bg-sky-300/70" />
            <span className="text-slate-200/80">Enterprise RAG for PDFs</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-300/80">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 font-medium text-emerald-100 shadow-sm backdrop-blur">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(34,197,94,0.35)]" />
              <span>Live RAG shell</span>
            </div>
            <NavPill href="/">
              <ArrowLeft className="size-3" />
              Return Home
            </NavPill>
          </div>
        </header>

        <section className="grid flex-1 gap-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
          <article className="relative flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-[0_0_0_1px_rgba(148,163,184,0.35),0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-3xl dark:bg-slate-900/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Pill variant="neutral" size="sm">
                  <FileText className="size-3.5 text-sky-300" />
                  Document workspace
                </Pill>
                <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
                  Turn static PDFs into live, searchable knowledge.
                </h1>
                <p className="mt-2 max-w-md text-sm text-slate-300/80">
                  Ingest assets once, then ask precise, auditable questions powered by
                  retrieval-augmented generation.
                </p>
              </div>
            </div>

            <PDFUploader />
          </article>

          <article className="relative flex min-h-115 flex-col rounded-3xl border border-white/10 bg-linear-to-br from-slate-900/70 via-slate-950/80 to-slate-900/90 p-4 shadow-[0_0_0_1px_rgba(148,163,184,0.4),0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-3xl">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <Pill variant="neutral" size="sm">
                <MessageCircle className="size-3.5 text-violet-300" />
                Chat with your documents
              </Pill>
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(34,197,94,0.35)]" />
                <span>GPT-4o-mini · RAG shell</span>
              </div>
            </div>

            <ChatInterface />
          </article>
        </section>
      </main>
    </div>
  );
}
