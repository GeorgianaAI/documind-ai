import { OpenAIEmbeddings } from "@langchain/openai";
import { Index } from "@upstash/vector";
import PDFParser from "pdf2json";
import { chunkText } from "@/lib/ai/chunker";

export type RetrievedChunk = {
  id: number;
  text: string;
};

type ChunkMetadata = {
  text: string;
};

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

const index = new Index<ChunkMetadata>({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});


async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true);

    pdfParser.on("pdfParser_dataError", (errData: unknown) => {
      const error = errData as { parserError?: unknown } | Error;
      reject((error as { parserError?: unknown })?.parserError || error);
    });
    pdfParser.on("pdfParser_dataReady", () => {
      resolve(decodeURIComponent(pdfParser.getRawTextContent()));
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function ingestPdfForSession(buffer: Buffer, sessionId: string) {
  try {
    const text = await extractTextFromPdf(buffer);

    if (!text || text.trim().length < 10) {
      throw new Error("Extraction resulted in empty text.");
    }

    const chunks = chunkText(text, 1000, 200);
    const vectors = await embeddings.embedDocuments(chunks);

    await index.namespace(sessionId).upsert(
      chunks.map((chunk, i) => ({
        id: `${sessionId}-${i}`,
        vector: vectors[i],
        metadata: { text: chunk },
      })),
    );

    return { success: true };
  } catch (error) {
    console.error("❌ Ingestion Error:", error);
    throw error;
  }
}

export async function retrieveRelevantChunks(
  sessionId: string,
  query: string,
  k = 3,
): Promise<RetrievedChunk[]> {
  const queryVector = await embeddings.embedQuery(query);

  const results = await index.namespace(sessionId).query({
    vector: queryVector,
    topK: k,
    includeMetadata: true,
  });

  return results
    .filter((r) => r.score > 0)
    .map((r, i) => ({
      id: i,
      text: r.metadata!.text,
    }));
}
