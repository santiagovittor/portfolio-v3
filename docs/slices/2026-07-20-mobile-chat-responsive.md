# Slice: Interview chat — mobile-adapted layout, not clumsy wrap

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`.
> Self-contained — read fully before touching files.

## The complaint (verbatim from BRIEF.md)

> Symptoms I can see: mobile version has weird stuff in the chatbot. the
> quick cards dont adapt well to the mobile version and occupy almost the
> entire chat screen. overall in mobile the chatbot looks clumsy and not
> cool, so we should probably have a mobile chat version that maintains the
> spirit and essence of the web but adapted to a smaller screen

> [What I want] i want the website to be perfectly responsive and for the
> chatbot to work seamlessly in it. not clumsy behaviour, i want breathing
> space without losing functions. it needs to look beautiful. investigate
> ux ui techniques 2026.

## Scope note on "investigate 2026 UX techniques"

Grounded in the actual, concrete problems found in this codebase (below),
not a license to bolt on trendy patterns for their own sake. The 2026
mobile-chat reference points cited in this doc name a specific, verifiable
current pattern (used across mainstream chat products) for one specific
element (suggestion chips) — apply it because it fixes the found problem,
not because it's new. Santiago will judge the result on "uncramped and
still works," not on pattern-recognition.

## Root cause (investigated, not guessed)

Two independent elements combine to produce "occupy almost the entire chat
screen":

**1. The suggestion chips (`app/interview/transcript.tsx`, the empty-state
block, `SUGGESTIONS`/`notes`).** Rendered as:

```tsx
<ul className="mt-10 flex flex-wrap items-start gap-4" aria-label="Suggested questions">
  {notes.map((s, i) => (
    <li key={s}>
      <button className="interview-note" style={{ "--tilt": `${[-2, 1.5, 2.5][i % 3]}deg` }}>
```

`.interview-note` in `app/globals.css` sets `max-width: 15rem` (240px) plus
`rotate: var(--tilt)` (a -2°/1.5°/2.5° tilt) and a drop shadow. On a
375-390px viewport, the transcript container has `px-5` (20px) padding on
each side, leaving ~335-350px of content width. Three tilted 240px cards in
a `flex-wrap` row can't fit two-abreast at that width, so they stack to
2-3 rows; the CSS `rotate` also expands each card's effective visual
bounding box past its box-model width, and combined with the shadow this
reads busy and eats significant vertical space in the empty/greeting state
— all *before* the visitor has sent a single message, inside a viewport-
locked (`h-svh`, `overflow-hidden`) chat shell. This is almost certainly
the concrete thing being described as "quick cards... occupy almost the
entire chat screen."

**2. The tool-response cards (`app/interview/cards.tsx`:
`ProjectCard`/`TasteCard`/`ContactCard`, and `MusicCard` in
`music-card.tsx`).** All share `className="plate mt-6 max-w-md ..."`
(448px cap). On a ~335-350px-wide mobile content column, `max-w-md` is
already moot — the card renders at the full available width regardless.
That's not itself a bug, but combined with the tilted chips above and each
card's own internal padding (`p-4`), a mobile visitor scrolling the
transcript sees a dense stack of full-bleed-feeling boxes with little
visual air between them and the surrounding chat chrome — which reads as
"clumsy," matching the complaint, even though no single card is
technically malformed.

## Goal

Mobile interview chat keeps its full functionality (suggestions, tool
cards, streaming answers, input) but reads as *composed for* a small
screen — deliberate breathing room, not a cramped rescale of the desktop
layout. Desktop layout (tilted index-card suggestions, current card
widths) is unaffected — this is a mobile-breakpoint-scoped adaptation, not
a redesign of the desktop chat.

## Non-goals

- Don't touch the desktop (`≥768px`) suggestion-chip layout, tilt effect,
  or card widths — those aren't part of the complaint.
- Don't rewrite the chat's data/streaming logic (`useChat`, `Transcript`'s
  state management) — this is a layout/CSS pass, not a functional change.
- Don't add a chat framework, carousel library, or any new npm dependency.
  Everything here is achievable with native CSS scroll-snap + existing
  Tailwind utilities.
- Don't scope-creep into rewriting `WordReveal`, `StageDirection`, or the
  tool-card *contents* — only their container sizing/spacing on mobile.

## The one gray area against DESIGN.md — resolve explicitly, don't second-guess

`DESIGN.md`'s anti-patterns list bans "Carousels... scroll-jacking" (hard
ban). Task 1 below proposes a horizontally-scrollable row for suggestion
chips on mobile. **This is not the banned pattern**: DESIGN.md's ban targets
autoplaying/JS-driven decorative carousels that hijack scroll. A native
`overflow-x: auto` + `scroll-snap-type: x` row — user-driven, no autoplay,
no JS scroll-jacking, standard OS-level momentum scrolling — is a bare
input affordance, the same mechanism as a horizontally-scrollable tab bar.
State this distinction in the `DESIGN.md` note this slice adds (Task 4)
so a future reader doesn't misread the ban as covering this.

---

## Task 1: Suggestion chips — single-row scroll-snap rail on mobile

**2026 reference point** (grounds this choice, doesn't license going
further than needed): the dominant mobile pattern for chat-app suggested
prompts (ChatGPT, Claude, and Gemini's mobile clients as of 2026) is a
single horizontally-scrollable row of chips below the fold-safe area,
rather than a wrapping multi-row grid — it keeps the suggestions' vertical
footprint to one line regardless of count, and lets the visitor scan/swipe
past them quickly without them competing with the input for screen space.

- [ ] Below `md:` (768px), change the suggestion list from
      `flex flex-wrap` to a single-row `flex overflow-x-auto` rail:
      `scroll-snap-type: x mandatory` on the container, `scroll-snap-align:
      start` on each `<li>`, with normal native scrolling (no JS, no
      library) — the container needs enough right-padding/margin that the
      last chip doesn't sit flush against the viewport edge.
- [ ] On mobile, drop the `rotate`/tilt effect (`--tilt`) — keep it desktop-
      only via a `md:` breakpoint variant of `.interview-note`, or scope
      the tilt CSS custom property so it's only applied above `768px`.
      The tilted-index-card look is a desktop editorial flourish; at
      chip-row scale on mobile it doesn't need to survive, and removing it
      also removes the bounding-box overflow problem noted in the root
      cause.
- [ ] Confirm the chip row is horizontally scrollable via touch AND via
      keyboard (native `overflow-x: auto` containers are scrollable with
      arrow keys once focused/tabbed into on evergreen browsers — verify,
      don't assume) — no custom carousel JS needed either way.
- [ ] Verify `aria-label="Suggested questions"` on the `<ul>` still reads
      correctly with a screen reader, and that scroll position doesn't
      trap focus or skip any chip in tab order.

## Task 2: Tool-response cards — deliberate mobile width, not incidental full-bleed

This is a judgment call — decide it visually (Task 3), don't guess blind:

- [ ] **Option A — capped width with visible chat chrome at the edges.**
      Change the card container on mobile to something like `max-w-[92vw]`
      (or similar) instead of letting `max-w-md` collapse to 100% of the
      padded column by default — leaves a sliver of surrounding
      background visible so the card reads as "a card in a chat," not "the
      chat is now a card."
- [ ] **Option B — deliberate full-bleed.** Keep the card at full content
      width but tighten its internal padding/spacing so it reads
      intentional (composed for the space) rather than cramped —
      increase breathing room *inside* the card instead of around it.
- [ ] Apply to all four card types that share this pattern:
      `ProjectCard`, `TasteCard`, `ContactCard` (`app/interview/cards.tsx`)
      and `MusicCard` (`app/interview/music-card.tsx`) — check
      `music-card.tsx`'s current container class before assuming it
      matches the other three exactly.

## Task 3: Visual review checkpoint

- [ ] `npm run dev`, check the interview page at 375px and 390px
      (iPhone-class viewports) with the empty state (chips visible) and
      with at least one tool card rendered (ask a question that triggers
      `show_project`/`show_taste`/`contact_card` to see a real card, not a
      guess at how it'll look).
- [ ] Pick between Option A/B from Task 2 based on the actual rendered
      result, not in the abstract. Note which was chosen.
- [ ] Confirm: the chip row no longer eats most of the visible chat height
      before a message is sent; a visitor can see meaningfully more of the
      input/conversation area above the fold than before this slice.
- [ ] If it still looks cramped after Tasks 1-2, do not keep tweaking
      blind — surface the specific remaining issue (screenshot + what
      looks wrong) rather than guessing at another CSS pass.

## Task 4: Full-site 375px responsive sweep

"Perfectly responsive" in the brief is broader than the chat. Use this
task to confirm (not necessarily fix — flag anything found as a separate
follow-up, don't scope-creep a fix into this slice unless it's a genuine
one-line accident) that nothing else has a mobile breathing-room problem:

- [ ] At 375px, scroll the entire site top to bottom: hero, about, work,
      contact, footer, nav.
- [ ] Confirm no horizontal overflow/scroll anywhere (a common tell:
      `document.documentElement.scrollWidth >
      document.documentElement.clientWidth` in the console should be
      false at every scroll position).
- [ ] Confirm the interview page's sticky input + `env(safe-area-inset-
      bottom)` padding is unaffected by this slice's changes (it wasn't
      touched, but verify — a mobile chat layout change is exactly the
      kind of edit that can silently regress a safe-area rule).
- [ ] Note any *other* mobile issues found during this sweep in the commit
      message or a follow-up note — do not silently fix unrelated things
      in this commit.

## Task 5: Update DESIGN.md — one clarifying note

- [ ] Add a short note near the "Carousels... hard ban" anti-pattern line
      in `DESIGN.md` clarifying that a native, non-autoplaying,
      user-driven `overflow-x` scroll-snap row (as used for mobile
      suggestion chips) is not what that ban targets — so a future
      reader/session doesn't misapply the ban or, worse, avoid a correct
      pattern out of caution.

## Task 6: Verify and commit

- [ ] `npm run build` — zero errors, zero type errors.
- [ ] `npx tsc --noEmit` — zero errors.
- [ ] `npm run lint` — zero errors.
- [ ] `prefers-reduced-motion: reduce` check — scroll-snap and native
      overflow scrolling aren't animations and shouldn't be affected, but
      confirm nothing in this slice's CSS accidentally introduced a
      motion dependency.
- [ ] Re-run the Task 3 visual check once more after Tasks 4-5's edits.
- [ ] Commit: `git add app/interview/transcript.tsx app/interview/cards.tsx app/interview/music-card.tsx app/globals.css DESIGN.md`
      (adjust to whatever actually changed), message style:
      `feat: mobile-adapted interview chat — scroll-snap suggestions, deliberate card width`.
