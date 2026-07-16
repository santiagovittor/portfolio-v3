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
