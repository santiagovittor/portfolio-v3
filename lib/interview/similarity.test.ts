import { describe, expect, it } from "vitest";
import { normalize, topK, type IndexedChunk } from "./similarity";

const chunk = (id: string, embedding: number[]): IndexedChunk => ({
  id, source: id, tags: [], text: id, embedding: normalize(embedding),
});

describe("normalize", () => {
  it("produces a unit vector", () => {
    const [x, y] = normalize([3, 4]);
    expect(x).toBeCloseTo(0.6);
    expect(y).toBeCloseTo(0.8);
  });
  it("leaves the zero vector as zeros instead of dividing by zero", () => {
    expect(normalize([0, 0])).toEqual([0, 0]);
  });
});

describe("topK", () => {
  const chunks = [
    chunk("east", [1, 0]),
    chunk("north", [0, 1]),
    chunk("northeast", [1, 1]),
  ];
  it("ranks by cosine similarity, best first", () => {
    const got = topK([1, 0.1], chunks, 2);
    expect(got.map((c) => c.id)).toEqual(["east", "northeast"]);
    expect(got[0].score).toBeGreaterThan(got[1].score);
  });
  it("applies the minimum-score floor", () => {
    const got = topK([1, 0], chunks, 3, 0.9);
    expect(got.map((c) => c.id)).toEqual(["east"]);
  });
  it("returns at most k", () => {
    expect(topK([1, 1], chunks, 1)).toHaveLength(1);
  });
});
