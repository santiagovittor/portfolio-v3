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
const MODEL_ID = "gemini-embedding-001"; // verified in node_modules/@ai-sdk/google/dist/index.d.ts
const DIMENSIONS = 768;

// .env.local is not auto-loaded outside Next
for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

// ponytail: wrapped in main() — package.json has no "type": "module", so tsx/esbuild
// compiles this file as CJS, which rejects top-level await. Adding "type": "module"
// would affect the whole Next.js build, so a wrapper is the smaller fix.
async function main() {
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
    model: google.embedding(MODEL_ID), // .textEmbedding() is deprecated in favor of .embedding()
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
}

main();
