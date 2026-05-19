import { describe, it, expect } from "vitest";
import { chunkText } from "./chunker";

describe("chunkText", () => {
  it("returns empty array for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("returns a single chunk when text is shorter than chunk size", () => {
    const text = "The moon is Neon Pink.";
    const result = chunkText(text, 1000, 200);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it("returns a single chunk when text is exactly chunk size", () => {
    const text = "a".repeat(1000);
    const result = chunkText(text, 1000, 200);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it("produces overlapping chunks with the correct stride", () => {
    // 1800-char text → stride = 1000 - 200 = 800 → chunks start at 0, 800
    const text = "a".repeat(1800);
    const result = chunkText(text, 1000, 200);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(1000);
    expect(result[1]).toHaveLength(1000); // 800..1800 = 1000 chars
    // Overlap: last 200 chars of chunk 0 === first 200 chars of chunk 1
    expect(result[0].slice(800)).toBe(result[1].slice(0, 200));
  });

  it("normalises whitespace before chunking", () => {
    const text = "hello   world\n\nfoo";
    const result = chunkText(text, 1000, 200);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("hello world foo");
  });
});
