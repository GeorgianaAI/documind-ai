export function chunkText(text: string, chunkSize = 1000, chunkOverlap = 200): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];

  if (!normalized) return chunks;

  let start = 0;
  while (start < normalized.length) {
    const end = start + chunkSize;
    chunks.push(normalized.slice(start, end));
    if (end >= normalized.length) break;
    start = end - chunkOverlap;
  }

  return chunks;
}
