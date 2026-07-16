# Interview slice 5: Press check (hardening + polish) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship-ready: metadata, sitemap, drift guards, abuse verification, a11y and performance gates passed with evidence, docs updated.

**Architecture:** No new features. Tightening screws, proving budgets, recording evidence.

**Tech Stack:** Existing.

## Global Constraints

- Acceptance criteria (spec): Lighthouse mobile ≥ 90 on `/interview`, console clean, keyboard navigable, reduced-motion clean, 4.5:1 contrast, one `<h1>`.
- Evidence over assertions: every gate below produces recorded output (numbers, screenshots, or logs) in the final report.
- `npm test`, `npx tsc --noEmit`, `npm run build` clean before every commit.

---

### Task 1: Metadata + sitemap

**Files:**
- Modify: `app/interview/page.tsx` (extend `metadata`)
- Modify: `app/sitemap.ts` (add `/interview`)

- [ ] **Step 1: Extend page metadata**

```tsx
export const metadata: Metadata = {
  title: "Interview",
  description:
    "A live interview with Santiago Vittor — conducted by you, answered by an AI stand-in grounded in his own words.",
  openGraph: {
    title: "Interview with Santiago Vittor",
    description:
      "Conducted live, by you. Answers by an AI stand-in, grounded in Santiago's own words.",
    url: "/interview",
  },
};
```

- [ ] **Step 2: Sitemap** — open `app/sitemap.ts`, add an entry for
`/interview` following the exact shape of the existing entries (same
`lastModified` pattern the file already uses).

- [ ] **Step 3: Verify** — `npm run build`; then check the built page
`<head>` (view-source on dev) for the OG tags, and `/sitemap.xml` for the
new URL.

- [ ] **Step 4: Commit**

```bash
git add app/interview/page.tsx app/sitemap.ts
git commit -m "interview-5: metadata and sitemap"
```

### Task 2: Drift guards

**Files:**
- Test: `lib/interview/drift.test.ts`

**Interfaces:**
- Consumes: `PROJECT_SLUGS` from `./tools`; `app/work/case-studies.ts` read as TEXT (importing it would drag `next/image` static imports into vitest — read the file, don't import it).

- [ ] **Step 1: Write the test**

```ts
// lib/interview/drift.test.ts
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
```

- [ ] **Step 2: Run** — `npm test`: expect PASS (all three slugs match). Temporarily add a fake slug to `PROJECT_SLUGS`, re-run, expect FAIL, revert — proves the guard bites.

- [ ] **Step 3: Commit**

```bash
git add lib/interview/drift.test.ts
git commit -m "interview-5: slug drift guard"
```

### Task 3: Abuse + failure verification (no code expected — fix what fails)

- [ ] **Step 1: Rate limit** — from the browser, fire 6 questions inside a
minute (chips + enter). Expect the 6th to answer with the coffee line WITHOUT
a model call (check dev server logs). Record it.

- [ ] **Step 2: Long input** — paste 2,000 characters into the field. The
`maxLength` stops at 500; POST a 2,000-char message with curl anyway and
verify the server truncates (the answer should reflect only the first 500
chars).

- [ ] **Step 3: No key** — stop the dev server, unset `GEMINI_API_KEY`,
restart, ask a question. Expect the printer's-note error state, no unhandled
rejection in the server log, page still usable. Restore the key.

- [ ] **Step 4: JS off** — disable JavaScript (DevTools), load `/interview`.
The masthead and byline must render (server shell); the transcript area is
simply empty. No blank page.

- [ ] **Step 5: Fix anything that failed, smallest change that works, then commit with a message naming what was fixed.**

### Task 4: A11y + performance gates

- [ ] **Step 1: Keyboard pass** — full journey with keyboard only: nav →
chips → input → Ask → follow-up. Focus visible at every stop, no traps.

- [ ] **Step 2: Screen-reader sanity** — with the transcript `role="log"`,
verify (NVDA on Windows, or at minimum the accessibility tree in DevTools)
that a streamed answer is announced once, not per-token re-announced. If
per-token spam occurs, move `aria-live` to a wrapper that only contains
COMPLETED messages and announce the in-progress answer on finish — smallest
change that keeps announcements sane.

- [ ] **Step 3: Contrast spot-checks** — shadow-ink (#2a2e33) on paper
(#efeae1) for sources lines and Q rows; white on poppy for the Ask button.
Record the ratios (any checker); all ≥ 4.5:1.

- [ ] **Step 4: Lighthouse** — `npm run build && npm run start`, Lighthouse
mobile on `/interview`. Gate: ≥ 90 all categories. The page has no shader
and no hero image, so LCP is the masthead text — if performance dips, the
usual suspect is the client bundle; check that `cards.tsx` didn't pull
anything heavy and that the route is the only client island.

- [ ] **Step 5: Reduced motion** — DevTools Rendering → reduce: no cursor
blink, no register-heading animation, everything readable.

- [ ] **Step 6: ui-ux-pro-max pre-delivery checklist — a11y items ONLY** (per CLAUDE.md).

- [ ] **Step 7: Record all evidence, fix regressions, commit any fixes.**

### Task 5: Docs

**Files:**
- Modify: `SPEC.md`

- [ ] **Step 1: Update SPEC.md** — in Milestones, append:

```markdown
- **M10 — The Interview.** ✅ Shipped. `/interview`: magazine-interview
  chatbot, RAG over `content/bible` with build-time embeddings, retrieval
  sources shown as footnotes, three tools, guardrails ported from
  santiagovittor.store. Spec:
  docs/superpowers/specs/2026-07-16-interview-chatbot-design.md
```

And in Non-goals, delete the "Live RAG assistant (post-launch…)" line —
it's live now. Update the `/api/*` line in Pages & structure to
`` `/api/interview`  (the interview endpoint — only API route) ``. In
Launch content, update item 3 ("Portfolio AI assistant") to note the
assistant is now live at `/interview` and the case study, when written,
should link to it.

- [ ] **Step 2: Reminder for deploy** — confirm `GEMINI_API_KEY` is set in
the Vercel project env (Santiago does this in the dashboard). Note it in
the final report; do not attempt it yourself.

- [ ] **Step 3: Commit**

```bash
git add SPEC.md
git commit -m "interview-5: spec updated, M10 shipped"
```

## Advisor checkpoint (Opus 4.8) — final gate

- Re-run: `npm test`, `npx tsc --noEmit`, `npm run build`. All clean.
- Verify the evidence exists for: rate limit, truncation, no-key failure,
  Lighthouse ≥ 90, contrast ratios, keyboard pass. Reject "it works" without
  the numbers.
- Full conversation QA: 10 questions covering work, projects, tastes,
  hiring, Spanish, off the record, "are you real?", one injection, one
  out-of-scope, one tool. The persona must hold on all ten.
- Read the diff of the whole feature end to end once — the reviewer's read,
  looking for leftover debug, dead code, or DESIGN.md violations.
