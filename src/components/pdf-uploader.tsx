"use client";

import { CloudUpload, FileText, Sparkles } from "lucide-react";

import { useSessionId } from "@/hooks/use-session-id";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/use-toast";

import { useState } from "react";

export function PDFUploader() {
  const sessionId = useSessionId();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF document.",
      });
      return;
    }

    if (!sessionId) {
      toast({
        title: "Preparing workspace",
        description: "Please wait a moment and try again.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);

      const response = await fetch("/api/rag/ingest", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "Failed to ingest document.");
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("documind-ai-ingested", "true");
      }

      toast({
        title: "Document ready for chat!",
        description: "Ask a question in the chat panel to query this PDF.",
      });
    } catch (error) {
      toast({
        title: "Ingestion failed",
        description:
          (error as Error).message || "We couldn’t prepare this document. Please try again.",
      });
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden border-white/15 bg-slate-950/30 p-4 backdrop-blur-2xl shadow-inner shadow-slate-950/60">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-sky-500/15 blur-3xl" />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <Pill variant="neutral" size="sm">
              <CloudUpload className="size-3 text-sky-300" />
              PDF ingestion pipeline
            </Pill>
            <p className="text-sm text-slate-100">
              Upload compliance decks, research PDFs, or contracts. We&apos;ll slice them into
              semantic chunks and prep them for RAG.
            </p>
            <p className="text-sm text-slate-400">
              Each upload is split into 1000-character slices, embedded, and stored for this session
              only.
            </p>
            <Pill variant="neutral" size="sm">
              <Sparkles className="size-3 text-violet-300" />
              RAG-ready ingestion pipeline
            </Pill>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-sky-500/90 px-3 py-2 text-sm font-medium whitespace-nowrap text-slate-950 shadow-lg shadow-sky-500/40 ring-1 ring-sky-400/60 hover:bg-sky-400">
              <FileText className="size-3.5" />
              <span>{isProcessing ? "Processing…" : "Upload PDF"}</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </label>
          </div>
        </div>
      </Card>

      <Card className="border-white/10 bg-slate-950/40 p-3 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-100">Recent workspaces</p>
            <p className="text-sm text-slate-400">
              Once ingestion is live, your latest PDF collections will appear here.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Pill variant="neutral" size="sm">Session-based</Pill>
            <Pill variant="neutral" size="sm">In-memory vector store</Pill>
          </div>
        </div>
      </Card>
    </div>
  );
}
