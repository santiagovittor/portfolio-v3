# Slice 1 — The Exchange

The core interview moment as a live magazine transcript. Fully self-contained:
own styles (`exchange.css`, `xch-` prefix), mock stream (`mock.ts`), zero
imports from the existing chat code. Demo route: `/slices/exchange`
(noindexed, not in the sitemap).

## Animation timeline

One exchange, from submit to done:

| t | What fires | Duration / ease |
|---|------------|-----------------|
| 0 | Input clears. Q line mounts and lifts off the input: `y: 28 → 0`, `opacity: 0 → 1` | 450ms, `power3.out` |
| 0 | Ink-settle on the question text: `letter-spacing 0.06em → 0` (then cleared) | 450ms, `power2.out` |
| 0 | "Q —" marker resolves via ScrambleText (`chars: "Q—–·*"`) | 400ms |
| 0 | Thinking state: italic stage direction appears; REC block fades in (400ms) and its dot pulses (1.2s loop); tape counter ticks every 250ms | — |
| every 2.5s | Stage direction crossfades: out `opacity→0, y→-4` (300ms `power2.in`), swap text, in from `opacity 0, y 6` (350ms `power2.out`) | — |
| +1.8s (`THINKING_MS`) | Streaming starts. Margin timestamp ("00:42 — on FoodStyles") fades in | 600ms |
| streaming | Each 1–3 word chunk is appended as a `<span>`, split with **SplitText** (`type: "words"`), and revealed from `opacity: 0, y: 12, blur(4px)` with `stagger: 0.045` | 500ms/word, `power2.out`, `clearProps: "all"` |
| done | REC block fades out; the full answer is announced once to screen readers | — |

Chunks arrive every 60–140ms (mock), so word reveals overlap into a
continuous typesetting motion. `filter: blur` is used only on these short
word reveals, per the perf budget; `clearProps: "all"` drops the inline
styles (and will-change pressure) as soon as each word lands.

**Reduced motion:** no lift, no scramble, no blur reveal (chunks append as
plain text), stage direction is a single static line, REC dot doesn't pulse,
scroll follows instantly.

**Accessibility:** transcript is `<article>` → `<section>` → `h3` (question,
with an sr-only "Question:" prefix since the scrambling "Q —" marker is
`aria-hidden`) + `<p>` (answer). The input is a real `<input>` with a real
`<label>`. Streaming is announced via one visually-hidden
`aria-live="polite"` region: "Santiago is thinking." at submit, then the full
answer once, on completion — per-chunk announcements are deliberately
suppressed (same lesson as commit `13af192` on the real chat).

## Wiring the real model

Everything mock lives in `mock.ts`. To wire the real backend:

1. Replace `streamAnswer(text)` with a function
   `(question: string) => AsyncIterable<string>` that yields text chunks from
   your route (e.g. the AI SDK's `textStream`). The component only does
   `for await (const chunk of ...)` — chunk size doesn't matter, SplitText
   splits whatever arrives.
2. Replace the `MOCK_ANSWERS` cycle in `onSubmit` with the real call; `topic`
   (the margin label) should come from the server — a one-line
   classification alongside the answer, or the top RAG slice's title.
3. `THINKING_MS` becomes "time until first chunk" — delete the artificial
   delay and flip `thinking → streaming` when the first chunk arrives.
4. Single-flight guard (`busy`) already matches the real chat's behavior;
   errors from the stream should settle the exchange as `done` with an
   editorial apology line (not built here).
5. Optional cleanup: call `split.revert()` per chunk once its tween
   completes if long transcripts ever get heavy — currently the word
   wrappers are left in place, which is fine at interview length.

`stamp` (tape time) is client-side by design — it's the visitor's reading
clock, not server time.
