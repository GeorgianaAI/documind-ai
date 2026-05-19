import { NextResponse } from "next/server";
import { z } from "zod";

import { retrieveRelevantChunks } from "@/lib/ai/rag-engine";

const SourcesRequestSchema = z.object({
  query: z.string().min(1),
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = SourcesRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "A query and a valid session ID are required." },
      { status: 400 },
    );
  }

  const { query, sessionId } = parsed.data;
  const chunks = await retrieveRelevantChunks(sessionId, query, 3);

  return NextResponse.json({ sources: chunks }, { status: 200 });
}
