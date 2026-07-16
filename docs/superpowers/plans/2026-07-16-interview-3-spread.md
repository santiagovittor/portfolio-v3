# Interview slice 3: The spread (page UI) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The `/interview` page: masthead, live-typesetting transcript with footnoted answers, input, suggestion chips, and every state — mobile-first, reduced-motion clean.

**Architecture:** Server page shell (`app/interview/page.tsx`: metadata, Nav, masthead, ghost numeral) wrapping one client component (`app/interview/transcript.tsx`: `useChat` + rendering + input). Styling extends `app/globals.css` with a few classes that REUSE the existing idioms (`.index-row` clip, `.plate`, `.link-draw`, mono labels, laid paper). Tool parts are ignored in this slice (slice 4 renders them as cards) — the UI must not crash on them.

**Tech Stack:** `@ai-sdk/react` (`useChat`, `DefaultChatTransport`), existing design system.

## Global Constraints

- DESIGN.md governs: paper bg, ink text, Archivo body 16–18px lh 1.55 max 65ch, mono labels (Archivo 500 uppercase 11–12px tracking +0.08em), Newsreader italic ONLY for the byline / sources lines / off-the-record answers, radii = pill for the input field + `--radius-ticket` for the Ask button (documented ticket idiom), poppy at most once per viewport (the Ask button owns it here).
- **Ground truth is `node_modules`:** verify `useChat` return shape, `sendMessage` signature, `status` values, and `DefaultChatTransport` in `node_modules/@ai-sdk/react` before writing the component.
- No localStorage/cookies — conversation is React state only.
- One `<h1>` on the page. Transcript is `role="log"` + `aria-live="polite"`. Visible focus everywhere. 4.5:1 minimum contrast (shadow-ink on paper passes; verify anything lighter).
- Reduced motion: no cursor blink, no row rise — content appears in place.
- `npm test`, `npx tsc --noEmit`, `npm run build` clean before every commit; check 375/768/1440 px.

---

### Task 1: Shared message type + page shell

**Files:**
- Create: `lib/interview/types.ts`
- Create: `app/interview/page.tsx`
- Create (placeholder for Task 2): `app/interview/transcript.tsx`

**Interfaces:**
- Produces: `type InterviewMessage = UIMessage<{ sources?: { label: string }[]; offTheRecord?: boolean }>` — the client-side view of slice 2's metadata; slice 4 imports it too.

- [ ] **Step 1: Write `lib/interview/types.ts`**

```ts
// lib/interview/types.ts
import type { UIMessage } from "ai";

export type InterviewMetadata = {
  sources?: { label: string }[];
  offTheRecord?: boolean;
};

export type InterviewMessage = UIMessage<InterviewMetadata>;
```

- [ ] **Step 2: Write the page shell**

```tsx
// app/interview/page.tsx
import type { Metadata } from "next";
import { Nav } from "../components/nav";
import { Transcript } from "./transcript";

export const metadata: Metadata = {
  title: "Interview",
  description:
    "A live interview with Santiago Vittor — conducted by you, answered by an AI stand-in grounded in his own words.",
};

export default function InterviewPage() {
  return (
    <>
      <Nav variant="paper" />
      <main className="laid-paper relative isolate min-h-svh overflow-hidden border-b border-shadow-ink/15 bg-paper px-5 pb-16 pt-32 md:px-16 md:pt-40">
        <span aria-hidden className="ghost-numeral -z-10">
          03
        </span>
        <header className="mx-auto w-full max-w-[72ch]">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink">
            In conversation — Buenos Aires
          </p>
          <h1
            data-text="Interview with Santiago Vittor"
            className="register mt-3 text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.02] tracking-tight"
          >
            Interview with Santiago Vittor
          </h1>
          <p className="mt-4 font-serif italic text-shadow-ink">
            Conducted live, by you. Answers by an AI stand-in, grounded in
            Santiago&apos;s own words.
          </p>
        </header>
        <Transcript />
      </main>
    </>
  );
}
```

- [ ] **Step 3: Stub the client component so the build passes**

```tsx
// app/interview/transcript.tsx
"use client";

export function Transcript() {
  return <div className="mx-auto mt-12 w-full max-w-[72ch]" />;
}
```

- [ ] **Step 4: Verify** — `npm run build` clean; visit `/interview`: masthead renders, nav is ink-on-paper, ghost numeral sits lower-right, no console errors.

- [ ] **Step 5: Commit**

```bash
git add lib/interview/types.ts app/interview/page.tsx app/interview/transcript.tsx
git commit -m "interview-3: /interview page shell and masthead"
```

### Task 2: Transcript component (the whole conversation UI)

**Files:**
- Modify: `app/interview/transcript.tsx` (replace stub)

**Interfaces:**
- Consumes: `POST /api/interview` (slice 2), `InterviewMessage` metadata `{ sources, offTheRecord }`.
- Produces: `data-part-slot` — assistant non-text parts render through `renderPart(part)`, which returns `null` in this slice; slice 4 replaces ONLY that function's body with tool cards.

- [ ] **Step 1: Verify `@ai-sdk/react` API in node_modules** (Global Constraints list). Adapt the code below to the installed signatures.

- [ ] **Step 2: Implement**

```tsx
// app/interview/transcript.tsx
"use client";

import { useState } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import type { InterviewMessage } from "@/lib/interview/types";

const SUGGESTIONS = [
  "What do you actually do at FoodStyles?",
  "Pitch me this website.",
  "What's on the record player?",
  "How does this chatbot work?",
  "Show me your favorite project.",
  "Can I hire you?",
];

// Slice 4 replaces this body with tool cards. Must never throw on
// part types it doesn't know.
function renderPart(_part: InterviewMessage["parts"][number]) {
  return null;
}

function Answer({ message }: { message: InterviewMessage }) {
  const offRecord = message.metadata?.offTheRecord;
  const sources = message.metadata?.sources ?? [];
  return (
    <div className={offRecord ? "font-serif italic" : ""}>
      {message.parts.map((part, i) =>
        part.type === "text" ? (
          <p key={i} className="mt-4 whitespace-pre-wrap text-lg leading-relaxed">
            {part.text}
          </p>
        ) : (
          <div key={i}>{renderPart(part)}</div>
        )
      )}
      {sources.length > 0 && (
        <p className="mt-3 font-serif text-sm italic text-shadow-ink">
          Sources: {sources.map((s) => s.label).join(" · ")}
        </p>
      )}
    </div>
  );
}

export function Transcript() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat<InterviewMessage>({
    transport: new DefaultChatTransport({ api: "/api/interview" }),
  });

  const busy = status === "submitted" || status === "streaming";
  const asked = new Set(
    messages
      .filter((m) => m.role === "user")
      .map((m) => m.parts.find((p) => p.type === "text")?.text)
  );
  const chips = SUGGESTIONS.filter((s) => !asked.has(s)).slice(0, 3);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    sendMessage({ text: q });
    setInput("");
  };

  return (
    <div className="mx-auto mt-12 w-full max-w-[72ch]">
      <div role="log" aria-live="polite" aria-label="Interview transcript">
        {messages.length === 0 && (
          <p className="border-t border-shadow-ink/20 pt-6 text-lg text-shadow-ink">
            The subject is at the table, coffee in hand. Ask anything — the
            work, this site, the record player.
          </p>
        )}
        {messages.map((message) =>
          message.role === "user" ? (
            <p
              key={message.id}
              className="mt-10 border-t border-shadow-ink/20 pt-5 text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink"
            >
              <span aria-hidden>Q — </span>
              {message.parts.find((p) => p.type === "text")?.text}
            </p>
          ) : (
            <Answer key={message.id} message={message} />
          )
        )}
        {busy && (
          <p aria-hidden className="mt-4 text-lg">
            <span className="interview-cursor">▮</span>
          </p>
        )}
        {error && (
          <p className="mt-6 border border-shadow-ink/20 p-4 text-shadow-ink">
            The line to Buenos Aires dropped. Ask again.
          </p>
        )}
      </div>

      {chips.length > 0 && (
        <ul className="mt-10 flex flex-wrap gap-3" aria-label="Suggested questions">
          {chips.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => ask(s)}
                disabled={busy}
                className="interview-chip px-4 py-2 text-sm font-medium"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="sticky bottom-0 mt-10 flex gap-3 bg-paper pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Ask the subject…"
          aria-label="Ask Santiago a question"
          className="w-full rounded-[var(--radius-pill)] border border-shadow-ink/30 bg-white px-5 py-3 text-base outline-none focus-visible:border-poppy"
        />
        <button
          type="submit"
          disabled={busy || input.trim().length === 0}
          className="btn btn-letterpress rounded-[var(--radius-ticket)] bg-poppy px-6 py-3 text-sm font-medium uppercase tracking-[0.08em] text-white disabled:opacity-50"
        >
          {busy ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
```

Deliberate deviation from the spec, keep it: the FIELD stays enabled while
streaming (disabling it would eject keyboard focus mid-conversation — an
a11y regression); only the SUBMIT is disabled. `// ponytail:` comment not
needed — this note is the record.

- [ ] **Step 3: Add the two new CSS idioms to `app/globals.css`**

```css
/* Interview: streaming cursor — type being set. Static under reduced motion. */
.interview-cursor {
  color: var(--color-ink);
}
@media (prefers-reduced-motion: no-preference) {
  .interview-cursor {
    animation: cursor-set 1s steps(2) infinite;
  }
}
@keyframes cursor-set {
  50% {
    opacity: 0;
  }
}

/* Interview: suggestion chips — the ticket-stub clip from .index-row at chip
   size, hairline warms to poppy on hover. */
.interview-chip {
  clip-path: polygon(
    0 0,
    calc(100% - 8px) 0,
    100% 8px,
    100% 100%,
    8px 100%,
    0 calc(100% - 8px)
  );
  background: color-mix(in srgb, var(--color-ink) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-shadow-ink) 20%, transparent);
  transition: border-color 300ms var(--ease-out-quart);
}
.interview-chip:hover:not(:disabled) {
  border-color: var(--color-poppy);
}
.interview-chip:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--color-poppy);
}
```

- [ ] **Step 4: Verify the full loop in the browser (dev server + API key)**

Gate checklist — record what you saw:
- Ask via chip and via keyboard: Q typesets as mono row, answer streams,
  cursor visible while streaming and gone after, sources line appears in
  Newsreader italic naming real chunks.
- "off the record: worst client story?" → that answer renders in italic.
- Spanish question → Spanish answer.
- Kill the dev server mid-question → printer's note error state renders.
- 375px: input sticky above the keyboard, nothing overflows; 768/1440:
  measure stays ≤ 72ch, masthead aligned.
- DevTools → Rendering → reduce motion: no cursor blink, page usable.
- Keyboard only: tab through chips → input → Ask; focus visible on all.
- Console clean.

- [ ] **Step 5: Full static verification** — `npm test`, `npx tsc --noEmit`, `npm run build` clean.

- [ ] **Step 6: Commit**

```bash
git add app/interview/transcript.tsx app/globals.css
git commit -m "interview-3: live transcript UI with footnoted answers"
```

## Advisor checkpoint (Opus 4.8)

- Run the Task 2 Step 4 browser gates yourself at 375 and 1440.
- Design review against DESIGN.md: radius usage (pill field, ticket Ask,
  chip clip), poppy count per viewport (must be 1 — the Ask button; chip
  hover borders appear only on interaction, acceptable), italic usage
  limited to byline/sources/off-record, measure ≤ 72ch.
- a11y: role="log" announces streamed answers; focus never trapped or
  ejected; contrast spot-checks (shadow-ink on paper, white on poppy).
- Confirm tool parts from slice 2 (ask "show me Canvass") don't crash the
  page — they should simply not render yet.
