export const dynamic = "force-dynamic";
export const maxDuration = 30; // Gives the AI time to think before Vercel kills it

import { NextResponse } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

import { retrieveRelevantChunks } from "@/lib/ai/rag-engine";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: { role: string; content: string }[];
      prompt?: string;
      sessionId?: string;
    };

    const messages = body.messages ?? [];
    const sessionId = body.sessionId ?? "default-session";

    let query: string | undefined;

    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
      query = lastUserMessage?.content?.trim();
    } else if (typeof body.prompt === "string") {
      query = body.prompt.trim();
    }

    if (!query) {
      return NextResponse.json({ error: "A user message or prompt is required." }, { status: 400 });
    }

    const contextChunks = await retrieveRelevantChunks(sessionId, query, 3);

    const context =
      contextChunks.length > 0
        ? contextChunks.map((c) => c.text).join("\n\n---\n\n")
        : "No context available from the current session.";

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content:
            "You are a professional assistant. Answer the user's question based ONLY on the following context. " +
            "If the answer isn't there, say you don't know.\n\n" +
            context,
        },
        ...(messages.length > 0
          ? messages.map((message) => ({
              role: message.role as "user" | "assistant",
              content: message.content,
            }))
          : [
              {
                role: "user" as const,
                content: query,
              },
            ]),
      ],
    });

    return result.toTextStreamResponse({
      headers: {
        "x-vercel-ai-data-stream": "v1",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Chat route error", error);
    return NextResponse.json(
      {
        error:
          "DocuMindAI encountered an issue generating a response. Please try again or reduce the document size.",
      },
      { status: 500 },
    );
  }
}
