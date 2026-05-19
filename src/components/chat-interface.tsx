"use client";

import { useEffect, useState } from "react";

import { useCompletion } from "@ai-sdk/react";
import { ArrowUpRight, Sparkles } from "lucide-react";

import type { RetrievedChunk } from "@/lib/ai/rag-engine";
import { useSessionId } from "@/hooks/use-session-id";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export function ChatInterface() {
  const sessionId = useSessionId();
  const { toast } = useToast();

  const [sources, setSources] = useState<RetrievedChunk[]>([]);
  const [hasStarted, setHasStarted] = useState(false);

  const { completion, input, isLoading, handleInputChange, handleSubmit, error } = useCompletion({
    api: "/api/chat",
    body: { sessionId },
    streamProtocol: "text",
  });

  const showWelcome = !hasStarted && !completion && !isLoading;

  useEffect(() => {
    if (!error) return;

    let description =
      error.message || "DocuMind AI ran into an issue generating a response. Please try again.";
    try {
      const parsed = JSON.parse(description) as { error?: string };
      if (parsed.error) description = parsed.error;
    } catch {
      // not JSON — use message as-is
    }

    toast({ title: "Chat error", description });
  }, [error, toast]);

  async function fetchSources(prompt: string) {
    if (!sessionId) {
      toast({
        title: "Preparing workspace",
        description: "Please wait a moment and try again.",
      });
      return;
    }

    try {
      const response = await fetch("/api/chat/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: prompt,
          sessionId,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "Failed to retrieve source snippets for this answer.");
      }

      const data = (await response.json()) as { sources?: RetrievedChunk[] };
      setSources(data.sources ?? []);
    } catch (err) {
      toast({
        title: "Source retrieval failed",
        description:
          (err as Error).message ||
          "We couldn’t load the source snippets. The answer may still be correct, but less verifiable.",
      });
    }
  }

  return (
    <Card className="flex h-full max-h-105 flex-col border-white/15 bg-slate-950/40 p-3 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="inline-flex size-6 items-center justify-center rounded-full bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/50">
            <Sparkles className="size-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">DocuMind AI</span>
            <span className="text-[11px] text-slate-400">
              Ask anything about your PDFs once ingestion is connected.
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex-1 max-h-105 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2">
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-1 pt-0">
          {showWelcome && (
            <div className="mt-4 space-y-2 rounded-2xl bg-slate-900/80 p-3 text-xs text-slate-300 ring-1 ring-white/10">
              <p className="font-medium text-slate-100">
                You&apos;re connected to the DocuMind RAG shell.
              </p>
              <p>Upload a PDF on the left, then ask grounded questions about its contents here.</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-slate-400">
                <li>“Summarize the key risks in our latest vendor contract.”</li>
                <li>“Compare Q3 vs Q4 performance from the attached financial report.”</li>
                <li>“What are the core findings from this research PDF?”</li>
              </ul>
            </div>
          )}

          {completion && (
            <div className="flex justify-start">
              <div className="inline-flex max-w-[85%] items-start gap-2 rounded-2xl bg-slate-900/80 px-3 py-2 text-xs text-slate-50 shadow-sm ring-1 ring-white/10">
                <div className="mt-px">
                  <div className="inline-flex size-5 items-center justify-center rounded-full bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40">
                    <Sparkles className="size-3" />
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-[11px] leading-relaxed md:text-xs">
                  {completion}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(event) => {
          const value = input.trim();
          if (!value) {
            event.preventDefault();
            return;
          }

          // Check for ingestion
          const isIngested =
            typeof window !== "undefined" && window.localStorage.getItem("documind-ai-ingested");

          if (!isIngested) {
            event.preventDefault();
            toast({
              title: "Upload a PDF first",
              description: "Ingest at least one PDF on the left before asking questions.",
            });
            return;
          }

          setHasStarted(true);
          void fetchSources(value);
          // Trigger the AI stream
          handleSubmit(event);
        }}
        className="mt-3 flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/70 p-2 text-xs shadow-inner shadow-slate-950/60"
      >
        {/* Input + Button unchanged */}
        <Input
          name="prompt"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question about your PDFs…"
          className="h-9 border-none bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          type="submit"
          size="icon-sm"
          className="shrink-0 rounded-xl bg-sky-500/90 text-slate-950 shadow-lg shadow-sky-500/40 hover:bg-sky-400"
          disabled={isLoading || !input.trim()}
        >
          <ArrowUpRight className="size-3.5" />
        </Button>
      </form>

      {completion && sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 px-1 text-[10px]">
          {sources.map((source, index) => (
            <button
              key={source.id ?? index}
              type="button"
              className="rounded-full border border-white/15 bg-slate-900/80 px-2.5 py-1 text-slate-200 shadow-sm backdrop-blur hover:border-sky-400 hover:text-sky-100"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                  void navigator.clipboard.writeText(source.text);
                  toast({
                    title: `Source ${index + 1} copied`,
                    description: "The full source snippet is now in your clipboard.",
                  });
                }
              }}
            >
              <span className="font-medium">Source {index + 1}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
