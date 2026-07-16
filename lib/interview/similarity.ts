export type IndexedChunk = {
  id: string;
  source: string;
  tags: string[];
  text: string;
  embedding: number[];
};

export type RetrievedChunk = {
  id: string;
  source: string;
  text: string;
  score: number;
};

export function normalize(v: number[]): number[] {
  const len = Math.hypot(...v);
  return len === 0 ? v.map(() => 0) : v.map((x) => x / len);
}

const dot = (a: number[], b: number[]) =>
  a.reduce((sum, x, i) => sum + x * b[i], 0);

export function topK(
  query: number[],
  chunks: IndexedChunk[],
  k = 4,
  minScore = 0.35
): RetrievedChunk[] {
  const q = normalize(query);
  return chunks
    .map((c) => ({ id: c.id, source: c.source, text: c.text, score: dot(q, c.embedding) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
