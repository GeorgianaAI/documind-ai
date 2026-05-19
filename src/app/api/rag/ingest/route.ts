import { NextResponse } from "next/server";
import { z } from "zod";

import { ingestPdfForSession } from "@/lib/ai/rag-engine";

const IngestMetaSchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  const formData = await request.formData();

  const parsed = IngestMetaSchema.safeParse({
    sessionId: formData.get("sessionId"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "A valid session ID is required." }, { status: 400 });
  }

  const { sessionId } = parsed.data;
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    await ingestPdfForSession(buffer, sessionId);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to ingest PDF." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { status: "ok", sessionId, message: "Document ready for chat." },
    { status: 200 },
  );
}
