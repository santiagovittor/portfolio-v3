import { describe, expect, it } from "vitest";
import { chunkFile, hashFiles, parseFrontmatter } from "./chunking";

const RAW = `---
source: resume
tags: work, experience
---

## Current role

I lead a squad.

## Skills

React and RAG.
`;

describe("parseFrontmatter", () => {
  it("extracts meta and body", () => {
    const { meta, body } = parseFrontmatter(RAW);
    expect(meta.source).toBe("resume");
    expect(meta.tags).toBe("work, experience");
    expect(body).not.toContain("---");
    expect(body).toContain("## Current role");
  });
  it("throws on a file without frontmatter", () => {
    expect(() => parseFrontmatter("## No fences")).toThrow(/frontmatter/i);
  });
});

describe("chunkFile", () => {
  it("one chunk per ## section with stable ids", () => {
    const chunks = chunkFile("10-work.md", RAW);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual({
      id: "10-work#current-role",
      source: "resume",
      tags: ["work", "experience"],
      text: "Current role\n\nI lead a squad.",
    });
    expect(chunks[1].id).toBe("10-work#skills");
  });
});

describe("hashFiles", () => {
  it("is order-independent and content-sensitive", () => {
    const a = { name: "a.md", raw: "one" };
    const b = { name: "b.md", raw: "two" };
    expect(hashFiles([a, b])).toBe(hashFiles([b, a]));
    expect(hashFiles([a, b])).not.toBe(hashFiles([a, { name: "b.md", raw: "TWO" }]));
  });
});
