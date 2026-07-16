// lib/interview/freshness.test.ts
// Fails when content/bible changed but `npm run embed` wasn't re-run.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hashFiles } from "./chunking";
import { getIndex } from "./retrieval";

describe("interview index freshness", () => {
  it("matches the current bible content (run `npm run embed` if this fails)", () => {
    const dir = join(process.cwd(), "content", "bible");
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".md") && f !== "QUESTIONNAIRE.md")
      .map((name) => ({ name, raw: readFileSync(join(dir, name), "utf8") }));
    expect(getIndex().bibleHash).toBe(hashFiles(files));
  });
});
