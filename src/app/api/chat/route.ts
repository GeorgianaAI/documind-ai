export const dynamic = "force-dynamic";
export const maxDuration = 30; // Gives the AI time to think before Vercel kills it

import { NextResponse } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { retrieveRelevantChunks } from "@/lib/ai/rag-engine";
import { chatRatelimit, getIp } from "@/lib/rate-limit";

const ChatRequestSchema = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.string() })).default([]),
  prompt: z.string().optional(),
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const parsed = ChatRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { messages, prompt, sessionId } = parsed.data;

    const { success } = await chatRatelimit.limit(getIp(request));
    if (!success) {
      return NextResponse.json(
        { error: "Daily chat limit reached. You have 2 turns per day — please try again tomorrow." },
        { status: 429 },
      );
    }

    let query: string | undefined;

    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
      query = lastUserMessage?.content?.trim();
    } else if (typeof prompt === "string") {
      query = prompt.trim();
    }

    if (!query) {
      return NextResponse.json({ error: "A user message or prompt is required." }, { status: 400 });
    }

    const contextChunks = await retrieveRelevantChunks(sessionId, query, 3);

    const context =
      contextChunks.length > 0
        ? contextChunks.map((c) => c.text).join("\n\n---\n\n")
        : "No context available from the current session.";

    const result = streamText({
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
          "DocuMind AI encountered an issue generating a response. Please try again or reduce the document size.",
      },
      { status: 500 },
    );
  }
}
