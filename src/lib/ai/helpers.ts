import { OpenAIEmbeddings } from "@langchain/openai";
import { Index } from "@upstash/vector";

export type ChunkMetadata = {
  text: string;
};

export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

let _index: Index<ChunkMetadata> | null = null;

function getIndex(): Index<ChunkMetadata> {
  if (!_index) {
    _index = new Index<ChunkMetadata>({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    });
  }
  return _index;
}

export function getNamespace(sessionId: string) {
  return getIndex().namespace(sessionId);
}
