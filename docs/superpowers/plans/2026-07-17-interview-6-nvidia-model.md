# Interview slice 6: NVIDIA chat model (Gemini quota escape) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Swap the chat model from `gemini-3.5-flash` (free tier exhausts after a
few messages/day) to `nvidia/nemotron-3-super-120b-a12b` on NVIDIA's hosted API
(build.nvidia.com). Embeddings stay on Gemini. Nothing else changes.

**Architecture:** `lib/interview/model.ts` is the ONE place the chat provider
lives — that was the point of the file. The NVIDIA API is OpenAI-compatible
(`https://integrate.api.nvidia.com/v1`), so the swap is `@ai-sdk/openai-compatible`
plus one model id. One wrinkle: Nemotron 3 is a reasoning model and leaks its
thinking into `content` unless the request body carries
`chat_template_kwargs: { enable_thinking: false }` — without it the interview
streams the model's inner monologue to visitors.

**Tech Stack:** existing + `@ai-sdk/openai-compatible` (one new dep, approved
for this slice — it's the official AI SDK adapter for OpenAI-compatible hosts).

## Decisions already made (verified live against the API on 2026-07-17, do not re-litigate)

- **Model: `nvidia/nemotron-3-super-120b-a12b`.** Verified with Santiago's key:
  ~1.5–2s completions across repeated calls, clean tool call
  (`finish_reason: "tool_calls"`, valid JSON args) with thinking disabled,
  answers in Spanish unprompted. First-party NVIDIA model on NVIDIA's own
  infra — least likely to queue or be delisted.
- **Rejected:** `meta/llama-3.3-70b-instruct` (works, tool calling verified,
  but shared-capacity — one probe queued >100s; route has `maxDuration = 30`),
  `moonshotai/kimi-k2.6` (404 for this account), `deepseek-ai/deepseek-v4-flash`
  (503 worker limit on probe), `mistralai/mistral-medium-3.5-128b` (29s cold).
- **Thinking toggle:** `chat_template_kwargs: { enable_thinking: false }` in the
  request body is what works. A `/no_think` system line does NOT work (verified:
  reasoning still leaked). The kwarg is non-negotiable.
- **Quota reality:** free tier is rate-limited (~40 RPM, NVIDIA staff confirmed
  it's not credit-metered and doesn't expire), not day-capped like Gemini free
  tier. The route's own limiter (5/min/IP) sits far under it.
- **Embeddings stay Gemini** (`gemini-embedding-001`, 768-dim, index committed).
  Swapping them would mean re-embedding the corpus for zero benefit — embedding
  quota is separate from the chat quota that was exhausting, and `retrieve()`
  makes one cheap embed call per question. `GEMINI_API_KEY` therefore remains
  required in dev and on Vercel.

## Global Constraints

- `npm test`, `npx tsc --noEmit`, `npm run build` clean before every commit.
- Read the installed package's actual types in `node_modules` before using it;
  if an API below doesn't match, STOP, adapt minimally, note it in the commit body.
- No other new deps. No changes to prompt, guards, tools, retrieval, or UI.

---

### Task 1: Install the adapter

- [ ] **Step 1:** `npm install @ai-sdk/openai-compatible` — npm resolves the
  version compatible with the installed `ai@^7`. If peer warnings appear, read
  them; do not force.

- [ ] **Step 2:** Open
  `node_modules/@ai-sdk/openai-compatible/dist/index.d.ts` and confirm:
  (a) `createOpenAICompatible` exists and its options shape (`name`, `baseURL`,
  `apiKey`); (b) how provider-specific request-body fields are passed — the
  expected mechanism is `providerOptions: { <name>: { ... } }` on the
  `streamText` call being spread into the request body. Note what you find.

### Task 2: Swap the model

**Files:**
- Modify: `lib/interview/model.ts`
- Modify: `app/api/interview/route.ts` (one added property)

- [ ] **Step 1: model.ts** — keep the `google` export (retrieval imports it
  for embeddings); replace the chat model:

```ts
// lib/interview/model.ts — the ONE place the model ids + provider live
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Embeddings only (gemini-embedding-001) — chat moved to NVIDIA, slice 6.
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const nvidia = createOpenAICompatible({
  name: "nvidia",
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY,
});

// Verified live 2026-07-17: ~2s, clean tool calls, Spanish OK — but ONLY with
// enable_thinking:false in the request body (see route.ts), else it streams
// its reasoning to the visitor.
export const chatModel = () => nvidia("nvidia/nemotron-3-super-120b-a12b");
```

- [ ] **Step 2: route.ts** — add the thinking kill-switch to the existing
  `streamText` call (mechanism per Task 1 Step 2 findings; expected form):

```ts
providerOptions: {
  nvidia: { chat_template_kwargs: { enable_thinking: false } },
},
```

  If the installed adapter does NOT spread provider options into the body,
  fall back to a custom `fetch` in `createOpenAICompatible` that parses the
  outgoing JSON body and injects the field — smallest wrapper that works, with
  a `// ponytail:` note. Verify with Step 3 either way.

- [ ] **Step 3: Prove the kwarg reaches the wire** — `npm run dev`, ask one
  question, and confirm the answer contains no reasoning monologue (phrases
  like "We need to respond…" / "The user said…"). Then temporarily flip
  `enable_thinking` to `true`, ask again, and confirm the monologue DOES
  appear — proves the flag is actually being sent, not silently dropped.
  Flip back to `false`.

- [ ] **Step 4: Gates** — `npm test`, `npx tsc --noEmit`, `npm run build`. All clean.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json lib/interview/model.ts app/api/interview/route.ts
git commit -m "interview-6: chat model to NVIDIA nemotron-3-super"
```

### Task 3: Behavior QA (the persona must survive the model swap)

- [ ] **Step 1:** In the browser at `/interview`, run and record:
  1. English work question — grounded answer, sources footnote present.
  2. Spanish question — Spanish answer.
  3. A question that should fire a tool (e.g. about a project) — tool card renders.
  4. "Off the record" question — off-the-record styling.
  5. One injection attempt — refusal line, no model call.
- [ ] **Step 2:** Streaming feels live (tokens appear progressively, not one
  blob), and the finish metadata (`sources`) still arrives — footnotes render.
- [ ] **Step 3:** Stop dev server, comment out `NVIDIA_API_KEY` in `.env.local`,
  restart, ask — expect the existing "line dropped" error state (route already
  503s on upstream failure), no crash. Restore key.
- [ ] **Step 4:** If the persona's voice degraded (Nemotron is chattier than
  Gemini flash), tighten NOTHING in the prompt in this slice — record the
  transcript and flag it in the final report for a human call.

### Task 4: Docs

**Files:**
- Modify: `docs/superpowers/plans/2026-07-16-interview-README.md`

- [ ] **Step 1:** Add row 6 to the slice table pointing at this file. In the
  Environment section, add `NVIDIA_API_KEY` (chat) alongside `GEMINI_API_KEY`
  (embeddings — still needed for `npm run dev` and `npm run embed`).
- [ ] **Step 2:** Note for deploy: Santiago adds `NVIDIA_API_KEY` to the Vercel
  project env (dashboard). Do not attempt it yourself; put it in the final report.
- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-07-16-interview-README.md
git commit -m "interview-6: slice index + env docs"
```

## Advisor checkpoint (Opus 4.8) — final gate

- Re-run `npm test`, `npx tsc --noEmit`, `npm run build`. Clean.
- Read the diff: the ONLY runtime changes are model.ts and the one
  `providerOptions` (or fetch-wrapper fallback) in route.ts. Reject scope creep.
- Demand the Task 2 Step 3 evidence (thinking on/off flip) — this is the one
  failure mode that silently ruins the feature while all gates stay green.
- Demand the five QA transcripts from Task 3. Persona holds on all five or the
  slice bounces.
