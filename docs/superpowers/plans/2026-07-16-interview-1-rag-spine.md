# Interview slice 1: RAG spine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build-time embedding pipeline (bible → committed JSON index) and the in-memory retrieval library, fully unit-tested.

**Architecture:** Pure logic (frontmatter parse, section chunking, hashing, cosine top-k) lives in `lib/interview/` as tested TypeScript. `scripts/embed.ts` (run via `tsx`) reads `content/bible/*.md`, embeds chunks with Gemini, and writes `data/interview-index.json` — committed, so `npm run build` never needs an API key. A freshness test fails when the bible changes without re-embedding.

**Tech Stack:** `ai` (embedMany/embed), `@ai-sdk/google`, `vitest`, `tsx`, Node `crypto`.

## Global Constraints

- New deps EXACTLY: `ai`, `@ai-sdk/react`, `@ai-sdk/google`, `zod` (runtime); `vitest`, `tsx` (dev). Nothing else.
- **Ground truth is `node_modules`.** Before writing embedding calls, open `node_modules/@ai-sdk/google/dist/index.d.ts` and confirm: the embedding-model factory name (`google.textEmbedding(...)` vs `textEmbeddingModel(...)`), the current Gemini embedding model id, and the provider-options shape for `taskType` / `outputDimensionality`. If they differ from this plan's code, adapt and note it in the commit body. Do not guess.
- Embeddings: request 768 dimensions if the provider supports it; round every float to 6 decimals when writing JSON (keeps the committed index small).
- `00-persona.md` is copied verbatim into the index's `persona` field, never chunked. `QUESTIONNAIRE.md` and `taste.ts` are never indexed.
- `npm run build` + `npx tsc --noEmit` + `npm test` clean before every commit.
- Cross-platform npm scripts (Windows dev box): no `&&` chains relying on sh, no `rm -rf`.

---

### Task 1: Dependencies and scripts

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `npm test` → `vitest run`; `npm run embed` → `tsx scripts/embed.ts`.

- [ ] **Step 1: Install**

```bash
npm install ai @ai-sdk/react @ai-sdk/google zod
npm install -D vitest tsx
```

- [ ] **Step 2: Add scripts to package.json**

```json
"test": "vitest run",
"embed": "tsx scripts/embed.ts"
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` (clean), `npm run build` (clean), `npm test`
Expected for `npm test`: vitest exits reporting no test files found — acceptable at this step only.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "interview-1: add ai sdk, zod, vitest, tsx"
```

### Task 2: Bible parsing and chunking (pure)

**Files:**
- Create: `lib/interview/chunking.ts`
- Test: `lib/interview/chunking.test.ts`

**Interfaces:**
- Produces:
  - `type BibleChunk = { id: string; source: string; tags: string[]; text: string }`
  - `parseFrontmatter(raw: string): { meta: Record<string, string>; body: string }`
  - `chunkFile(filename: string, raw: string): BibleChunk[]` — splits `body` on `\n## `, id = `<filename-sans-ext>#<kebab-heading>`, text = `<heading>\n<section body>` trimmed
  - `hashFiles(files: { name: string; raw: string }[]): string` — sha256 hex over files sorted by name

- [ ] **Step 1: Write the failing test**

```ts
// lib/interview/chunking.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./chunking`.

- [ ] **Step 3: Implement**

```ts
// lib/interview/chunking.ts
import { createHash } from "node:crypto";

export type BibleChunk = {
  id: string;
  source: string;
  tags: string[];
  text: string;
};

export function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error("bible file is missing frontmatter fences");
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { meta, body: raw.slice(match[0].length) };
}

const kebab = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function chunkFile(filename: string, raw: string): BibleChunk[] {
  const { meta, body } = parseFrontmatter(raw);
  const source = meta.source ?? filename;
  const tags = (meta.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  const stem = filename.replace(/\.md$/, "");
  return body
    .split(/\r?\n## /)
    .slice(1) // anything before the first ## is not a chunk
    .map((section) => {
      const text = section.trim();
      const heading = text.split(/\r?\n/, 1)[0];
      return { id: `${stem}#${kebab(heading)}`, source, tags, text };
    });
}

export function hashFiles(files: { name: string; raw: string }[]): string {
  const h = createHash("sha256");
  for (const f of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    h.update(f.name).update("\0").update(f.raw).update("\0");
  }
  return h.digest("hex");
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test` — expect all green. Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add lib/interview/chunking.ts lib/interview/chunking.test.ts
git commit -m "interview-1: bible frontmatter parse, chunking, hashing"
```

### Task 3: Cosine top-k (pure)

**Files:**
- Create: `lib/interview/similarity.ts`
- Test: `lib/interview/similarity.test.ts`

**Interfaces:**
- Produces:
  - `normalize(v: number[]): number[]`
  - `type IndexedChunk = { id: string; source: string; tags: string[]; text: string; embedding: number[] }`
  - `type RetrievedChunk = { id: string; source: string; text: string; score: number }`
  - `topK(query: number[], chunks: IndexedChunk[], k?: number, minScore?: number): RetrievedChunk[]` — defaults k=4, minScore=0.35; assumes chunk embeddings are pre-normalized; normalizes `query` itself; sorted by score desc.

- [ ] **Step 1: Write the failing test**

```ts
// lib/interview/similarity.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test` — FAIL, cannot resolve `./similarity`.

- [ ] **Step 3: Implement**

```ts
// lib/interview/similarity.ts
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
```

- [ ] **Step 4: Run tests, verify pass** — `npm test` green, `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add lib/interview/similarity.ts lib/interview/similarity.test.ts
git commit -m "interview-1: cosine top-k retrieval core"
```

### Task 4: Embed script + committed index

**Files:**
- Create: `scripts/embed.ts`
- Create (generated): `data/interview-index.json`

**Interfaces:**
- Consumes: `chunkFile`, `hashFiles` from `lib/interview/chunking`; `normalize` from `lib/interview/similarity`; `content/bible/*.md` (slice 0).
- Produces: `data/interview-index.json` with shape
  `{ bibleHash: string; model: string; dimensions: number; persona: string; chunks: IndexedChunk[] }` — slices 2+ import it.

- [ ] **Step 1: Verify the provider API in node_modules (do not skip)**

Open `node_modules/@ai-sdk/google/dist/index.d.ts`. Record: embedding factory name, the embedding model id it documents, provider-option keys for task type and output dimensionality. Adjust Step 2's code to what you found.

- [ ] **Step 2: Write `scripts/embed.ts`**

```ts
// scripts/embed.ts — build-time: bible → data/interview-index.json
// Run with: npm run embed   (requires GEMINI_API_KEY in .env.local)
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { embedMany } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { chunkFile, hashFiles, parseFrontmatter } from "../lib/interview/chunking";
import { normalize } from "../lib/interview/similarity";

const BIBLE_DIR = join(process.cwd(), "content", "bible");
const OUT = join(process.cwd(), "data", "interview-index.json");
const MODEL_ID = "gemini-embedding-001"; // verify against node_modules (Task 4 Step 1)
const DIMENSIONS = 768;

// .env.local is not auto-loaded outside Next
for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

const files = readdirSync(BIBLE_DIR)
  .filter((f) => f.endsWith(".md") && f !== "QUESTIONNAIRE.md")
  .map((name) => ({ name, raw: readFileSync(join(BIBLE_DIR, name), "utf8") }));

const persona = parseFrontmatter(
  files.find((f) => f.name === "00-persona.md")!.raw
).body.trim();

const chunks = files
  .filter((f) => f.name !== "00-persona.md")
  .flatMap((f) => chunkFile(f.name, f.raw));

const { embeddings } = await embedMany({
  model: google.textEmbedding(MODEL_ID),
  values: chunks.map((c) => c.text),
  providerOptions: {
    google: { taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: DIMENSIONS },
  },
});

const round = (v: number[]) => normalize(v).map((x) => Number(x.toFixed(6)));

writeFileSync(
  OUT,
  JSON.stringify(
    {
      bibleHash: hashFiles(files),
      model: MODEL_ID,
      dimensions: DIMENSIONS,
      persona,
      chunks: chunks.map((c, i) => ({ ...c, embedding: round(embeddings[i]) })),
    },
    null,
    0
  )
);

console.log(`indexed ${chunks.length} chunks → data/interview-index.json`);
```

- [ ] **Step 3: Run it**

Run: `npm run embed`
Expected: `indexed N chunks → data/interview-index.json` where N ≈ 17
(sections across 20/30/40/50/90 files). If the provider rejects an option
key, re-check Step 1 findings and adapt.

- [ ] **Step 4: Inspect the output**

Check: file exists, is < 1.5 MB, `persona` starts with `# Who is speaking`,
every chunk has a 768-length embedding, no chunk from `00-persona` or
`QUESTIONNAIRE`.

- [ ] **Step 5: Commit (index is committed on purpose — deterministic builds)**

```bash
git add scripts/embed.ts data/interview-index.json
git commit -m "interview-1: embed script + committed retrieval index"
```

### Task 5: Runtime retrieval + freshness gate

**Files:**
- Create: `lib/interview/retrieval.ts`
- Test: `lib/interview/freshness.test.ts`

**Interfaces:**
- Consumes: `data/interview-index.json`, `topK`, `embed` from `ai`.
- Produces:
  - `getIndex(): { bibleHash: string; persona: string; chunks: IndexedChunk[] }`
  - `retrieve(query: string): Promise<RetrievedChunk[]>` — embeds with `taskType: RETRIEVAL_QUERY`, then `topK` (slice 2's route calls exactly this).

- [ ] **Step 1: Write the failing freshness test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails** — `npm test`: FAIL, cannot resolve `./retrieval`.

- [ ] **Step 3: Implement**

```ts
// lib/interview/retrieval.ts
import { embed } from "ai";
import { google } from "@ai-sdk/google";
import index from "@/data/interview-index.json";
import { topK, type IndexedChunk, type RetrievedChunk } from "./similarity";

type InterviewIndex = {
  bibleHash: string;
  model: string;
  dimensions: number;
  persona: string;
  chunks: IndexedChunk[];
};

export function getIndex(): InterviewIndex {
  return index as InterviewIndex;
}

export async function retrieve(query: string): Promise<RetrievedChunk[]> {
  const { embedding } = await embed({
    model: google.textEmbedding(getIndex().model),
    value: query,
    providerOptions: {
      google: { taskType: "RETRIEVAL_QUERY", outputDimensionality: getIndex().dimensions },
    },
  });
  return topK(embedding, getIndex().chunks);
}
```

Note: `google` (the default provider instance) reads
`GOOGLE_GENERATIVE_AI_API_KEY` by default. Verify in
`node_modules/@ai-sdk/google` whether it also accepts `GEMINI_API_KEY`;
if not, create the provider with
`createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })` in a
shared `lib/interview/model.ts` and use it here and in slice 2. Whatever
you choose, ONE env var name across the project: `GEMINI_API_KEY`.

- [ ] **Step 4: Run tests, verify pass** — `npm test` all green (freshness passes because Task 4 just ran embed). `npx tsc --noEmit`, `npm run build` clean.

- [ ] **Step 5: Manual retrieval smoke test**

Create a throwaway script or use `tsx -e` to call
`retrieve("what do you do at FoodStyles?")` and print ids/scores.
Expected: `10-work#current-role` ranks first with score well above 0.35.
Try `retrieve("what's on the record player?")` → a `40-tastes#music` hit.
Delete any throwaway file afterward.

- [ ] **Step 6: Commit**

```bash
git add lib/interview/retrieval.ts lib/interview/freshness.test.ts
git commit -m "interview-1: runtime retrieval + index freshness gate"
```

## Advisor checkpoint (Opus 4.8)

- `npm test`, `npx tsc --noEmit`, `npm run build` all clean.
- Inspect `data/interview-index.json`: size, dimensions, no persona/
  questionnaire leakage into chunks.
- Confirm the Step 5 smoke-test evidence (ids + scores) is in the
  implementer's report, not asserted from memory.
- Check the embedding API calls against `node_modules/@ai-sdk/google`
  yourself — this is the likeliest silent-drift point in the whole build.
