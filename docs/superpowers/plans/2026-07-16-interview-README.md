# The Interview — slice index

Spec: `docs/superpowers/specs/2026-07-16-interview-chatbot-design.md`
(read it FIRST, every slice assumes it).

Six slices, strictly in order — each produces working, verifiable software
on its own:

| # | Plan file | Delivers | Depends on |
|---|-----------|----------|------------|
| 0 | `2026-07-16-interview-0-bible.md` | The corpus (`content/bible/`) + questionnaire | — |
| 1 | `2026-07-16-interview-1-rag-spine.md` | Deps, embed script, index JSON, retrieval lib, unit tests | 0 |
| 2 | `2026-07-16-interview-2-wire.md` | Streaming API route, persona prompt, guardrails, tools | 1 |
| 3 | `2026-07-16-interview-3-spread.md` | `/interview` page UI, all states | 2 |
| 4 | `2026-07-16-interview-4-props.md` | Tool cards, nav + contact entry points, easter eggs | 3 |
| 5 | `2026-07-16-interview-5-press-check.md` | Hardening, a11y, Lighthouse, OG metadata | 4 |

## Roles

- **Implementer (Sonnet 5):** execute one slice at a time, step by step,
  checking boxes. Never skip a "verify" step. If an API in the plan doesn't
  match the installed package (`node_modules` types are the ground truth),
  STOP, read the types, adapt minimally, and note the deviation in the
  commit body. Never invent APIs.
- **Advisor (Opus 4.8):** review at each slice's "Advisor checkpoint"
  section — the checkpoint lists exactly what to inspect. Reject a slice
  that fails its gate; do not let unverified work stack.

## Environment

- `GEMINI_API_KEY` in `.env.local` (same variable name as the
  santiagovittor-store and portfolio2026 repos — Santiago has the key).
  Needed for `npm run dev`, `npm run embed`. NOT needed for `npm run build`
  (the embeddings index is committed).
- Node ≥ 20.9 (Next 16 floor). Windows dev machine; scripts must be
  cross-platform (no bash-isms in npm scripts).

## Non-negotiables (from CLAUDE.md + DESIGN.md, apply to every slice)

- `npm run build` + `npx tsc --noEmit` clean before every commit.
- Read a package's actual exports in `node_modules` before using it.
- DESIGN.md governs all visuals; ui-ux-pro-max only for a11y checks.
- No localStorage/cookies. No new deps beyond the approved list.
- Voice: sentence case, plain verbs, no "passionate/crafting" filler.
- One concern per commit, message style `interview-N: <what>`.
