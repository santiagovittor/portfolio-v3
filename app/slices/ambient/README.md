# Slice 2 — The Ambient Layer

Everything that keeps the interview room feeling alive: grain, parallax
numeral, spinning vinyl, asterisk cursor, and three marginalia suggestion
cards. Self-contained (`ambient.css`, `amb-` prefix); the only global
dependencies are the design tokens and the `.ghost-numeral` class. Demo
route: `/slices/ambient` (noindexed, not in the sitemap).

## The layers

| Element | Behavior | Timing / ease |
|---------|----------|---------------|
| **Grain** | Slice-scoped SVG `feTurbulence` (0.9 / 2 octaves), opacity 0.04, jittered with `steps(1)` so it flickers like film frames, transform-only, oversized 16px so edges never show | 0.7s loop, 4 positions |
| **Ghost "03"** | Scroll parallax (ScrollTrigger progress over the section, ±22px) + mouse parallax (±10px x / ±8px y), summed, clamped at ±30px, lerped at 0.06/frame in `gsap.ticker` | continuous |
| **Vinyl** | `rotation: "+=360"` at 8s/turn, `ease: none`, infinite. Hover eases `timeScale → 0` (spins down like a real platter), leave eases back to 1 | 0.9s, `power2.out` / `power2.in` |
| **Cursor** | Fixed asterisk, `mix-blend-mode: difference`, lerped at 0.3/frame (tighter than the numeral — it's the hand, not the room). Over `button/a/input/[data-cursor]`: scales to 2.1× and rotates 45°. Fine pointers only; native cursor hidden via `.amb-no-cursor` | 0.25s, `power2.out` |
| **Cards** | Base tilt via CSS `rotate: var(--tilt)` (-2.5° / 1.75° / 3°). Hover: CSS lift (−4px + deeper paper shadow, 300ms) + magnetic pull toward the cursor (offset × 0.15, clamped ±8px, on the *inner* span so it never fights the tilt/lift) + poppy underline draws itself (`pathLength=1` dash, `stroke-dashoffset 1 → 0`, 500ms draw / 150ms retract, pure CSS) | pull 0.4s `power3.out` |
| **Fly to input** | Click: card flies to the baseline placeholder (`x/y` to target, `scale → 0.2`, 550ms `power3.in`), text lands on the rule with an ink-settle (`letter-spacing 0.05em → 0`, opacity 0.4 → 1, 400ms), then the card drifts back after 0.9s so the demo replays | — |

Lenis runs the page scroll, driven through `gsap.ticker` with
`lagSmoothing(0)` and `lenis.on("scroll", ScrollTrigger.update)`, per the
spec stack. Everything animates transform/opacity only.

**Reduced motion:** the `gsap.matchMedia` block returns early — no Lenis, no
spin, no parallax, no custom cursor, no magnet; grain and caret hold still
(CSS media queries); card click fills the input line instantly. Coarse
pointers (touch) skip cursor + magnet even with motion allowed.

**Accessibility:** cards are real `<button>`s with visible text; underline
SVG, vinyl, numeral, grain, and cursor are all `aria-hidden`; the fly-target
line is `aria-live="polite"` so the chosen question is announced.

## Wiring into the real interview

- **Fly target** (`.amb-inputline`) is a placeholder — in integration, pass
  the real input's wrapper as the flight destination and delete the
  placeholder markup.
- **Card pick** dispatches a bubbling `CustomEvent("amb-pick", { detail: question })`
  from the target element. The interview shell listens on the section, sets
  the input value, and submits. (A function prop would trip Next's
  serializable-props rule on this server-imported demo page; once the slice
  sits under a client parent you can swap the event for a plain `onPick`
  prop.)
- In integration a picked card should stay **spent** (remove the demo's
  return flight) — an interview question gets asked once.
- **Lenis** should become a site-level singleton (root layout / template),
  not per-section — delete the instance here when integrating.
- **Grain:** the root layout already mounts the global `<Grain />`; on the
  real page keep only one (the slice's local grain exists so the demo is
  self-contained).
- The site bans cursor followers (DESIGN.md anti-patterns) — the asterisk
  cursor and magnetic cards are built per this brief's explicit direction;
  if they're kept, note the exception in DESIGN.md the way `--radius-ticket`
  is documented.
