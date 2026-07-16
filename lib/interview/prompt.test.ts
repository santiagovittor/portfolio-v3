import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "./prompt";

const chunks = [
  { id: "10-work#skills", source: "resume", text: "React and RAG.", score: 0.8 },
];

describe("buildSystemPrompt", () => {
  it("contains persona, chunks with source labels, language and register", () => {
    const p = buildSystemPrompt({
      persona: "# Who is speaking\nStand-in.",
      chunks,
      language: "es",
      offTheRecord: true,
    });
    expect(p).toContain("# Who is speaking");
    expect(p).toContain("[source: resume]");
    expect(p).toContain("React and RAG.");
    expect(p).toMatch(/answer in argentine spanish/i);
    expect(p).toMatch(/off the record/i);
  });
  it("states when nothing was retrieved", () => {
    const p = buildSystemPrompt({
      persona: "P", chunks: [], language: "en", offTheRecord: false,
    });
    expect(p).toMatch(/no reference material matched/i);
  });
});
