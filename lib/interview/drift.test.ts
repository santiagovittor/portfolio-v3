// Guards against silent drift between the tool enum and the case studies.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PROJECT_SLUGS } from "./tools";

describe("show_project slug enum", () => {
  it("matches the slugs in app/work/case-studies.ts", () => {
    const raw = readFileSync(
      join(process.cwd(), "app", "work", "case-studies.ts"),
      "utf8"
    );
    const inFile = [...raw.matchAll(/^\s*slug: "([^"]+)"/gm)].map((m) => m[1]);
    expect([...PROJECT_SLUGS].sort()).toEqual([...inFile].sort());
  });
});
