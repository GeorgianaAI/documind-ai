import Link from "next/link";
import { Brain, FileText, Search, UserLock, Zap, ArrowRight } from "lucide-react";

import { AmbientGlow } from "@/components/ui/ambient-glow";
import { FeatureCard } from "@/components/feature-card";
import { NavPill } from "@/components/ui/nav-pill";
import { Pill } from "@/components/ui/pill";
import type { PillProps } from "@/components/ui/pill";

const features: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  badge: string;
  badgeVariant: PillProps["variant"];
}[] = [
  {
    icon: FileText,
    iconColor: "text-sky-300",
    iconBg: "bg-sky-500/15 ring-sky-500/40",
    title: "Semantic PDF Ingestion",
    description:
      "Upload any PDF. Text is extracted, split into 1,000-character chunks with 200-character overlap, and embedded via OpenAI for precision semantic retrieval.",
    badge: "OpenAI · text-embedding-3-small",
    badgeVariant: "sky",
  },
  {
    icon: Search,
    iconColor: "text-violet-300",
    iconBg: "bg-violet-500/15 ring-violet-500/40",
    title: "Evidence-First Answers",
    description:
      "Every response is grounded in your document content. Clickable source pills expose the exact chunks backing each answer — no hallucination, no guesswork.",
    badge: "Upstash Vector · Top-3 cosine",
    badgeVariant: "violet",
  },
  {
    icon: Zap,
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/15 ring-amber-500/40",
    title: "Real-Time Streaming",
    description:
      "Answers stream token-by-token from GPT-4o-mini the moment retrieval completes — optimised for serverless execution with no perceptible wait.",
    badge: "gpt-4o-mini · RAG",
    badgeVariant: "amber",
  },
  {
    icon: UserLock,
    iconColor: "text-emerald-300",
    iconBg: "bg-emerald-500/15 ring-emerald-500/40",
    title: "Session-Scoped Privacy",
    description:
      "Your documents never leave your session. All vectors are stored in a private Upstash namespace scoped to your session ID — no data crosses session boundaries.",
    badge: "Upstash Vector · Session-scoped",
    badgeVariant: "emerald",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e293b,transparent_55%),radial-gradient(circle_at_bottom,#020617,#020617)] text-foreground">
      <AmbientGlow />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-14 md:py-20">
        {/* Nav bar */}
        <nav className="mb-16 flex items-center justify-between">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur-xl">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40">
              <Brain className="size-3.5" />
            </span>
            <span className="text-sky-100/80">DocuMind AI</span>
          </div>

          <NavPill href="/workspace">
            Open Workspace
            <ArrowRight className="size-3" />
          </NavPill>
        </nav>

        {/* Hero */}
        <section className="mb-20 flex flex-col items-center text-center">
          <Pill variant="neutral" size="md" dot className="mb-5">
            RAG-native · GPT-4o-mini · Upstash Vector
          </Pill>

          <h1 className="inline-flex max-w-3xl items-center gap-3 text-balance text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl lg:text-6xl">
            DocuMind <span className="text-sky-300">AI</span>
            <Brain className="size-9 shrink-0 text-sky-300 md:size-11 lg:size-13" />
          </h1>

          <p className="mt-5 max-w-xl text-balance text-sm text-slate-300/80 md:text-base">
            DocuMind AI ingests your documents, embeds them semantically, and answers your questions
            with evidence — not guesses. Every response cites its source.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500/90 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/30 ring-1 ring-sky-400/60 transition hover:bg-sky-400"
            >
              Start with your PDF
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>

        {/* Feature cards */}
        <section>
          <div className="mb-8 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-slate-500">
              How it works
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feat) => (
              <FeatureCard key={feat.title} {...feat} />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
          <Brain className="size-3" />
          <span>DocuMind AI — RAG-native PDF intelligence</span>
        </footer>
      </main>
    </div>
  );
}
