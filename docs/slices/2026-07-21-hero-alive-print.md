# Slice A: Hero — kill the sepia, make the print alive

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`.
> This slice is self-contained — read it fully before touching a file. It is
> the *look* half of the hero redesign; Slice B
> (`2026-07-21-hero-tactile-interaction.md`) is the *motion/interaction* half.
> Land A before B: B's tilt assumes A's layer structure. Steps use `- [ ]`.

## Source of truth, in order

1. `DESIGN.md` — tokens, type, motion budget. This slice edits its hero
   grade language (Task 6); until then DESIGN.md describes the rejected look.
2. `CLAUDE.md` — hard rules. **4.5:1 text contrast** binds this slice
   absolutely. The "no new dependencies without asking" rule is satisfied:
   Santiago approved GSAP explicitly on 2026-07-21 ("you are allowed to add
   new deps, to use lenis gsap or tilt if you want").
3. This slice.

## Dependencies

- [ ] `npm i gsap @gsap/react` — approved by Santiago 2026-07-21. Used here
      for **SplitText** only (Task 4); Slice B uses `gsap.quickTo`. GSAP is
      100% free since 3.13 including SplitText. `@gsap/react` gives the
      `useGSAP()` hook, which handles cleanup + StrictMode double-invoke in
      React 19 — do not hand-roll `useEffect` + `gsap.context()`.
- [ ] Register plugins at module level, not inside the component:
      `gsap.registerPlugin(useGSAP, SplitText)`.
- [ ] Client component boundary: anything importing GSAP needs
      `"use client"`. Keep it to the smallest possible leaf so the hero
      section itself stays a server component and the poster stays the LCP
      element (CLAUDE.md → performance budget).

## The complaint (verbatim, Santiago, 2026-07-21)

> current hero looks too muted. it has no life. there is no paper effect and
> instead it has an awful lifeless sepia tone. i want to take this hero to
> the next level and add animations, remove the awful italic copy: I design
> products and build them: interfaces, frontends, and the AI behind them.
> Buenos Aires, working US hours. […] i want something SPECIAL, that screams
> that i am a skillful web designer. this is 2026, sky is the limit.

## Diagnosis — why it reads dead

`app/globals.css:298-316` is self-contradicting:

```css
/* Analog grade: warm-faded, lifted blacks, desaturated - a Kodachrome still */
.hero-poster { filter: sepia(0.2) saturate(0.68) contrast(0.85) brightness(0.98); }
.hero-grade  { mix-blend-mode: color; opacity: 0.45; }  /* + a full-frame ink/poppy wash */
```

Kodachrome was famously **saturated**, not desaturated. What is actually
applied is *faded photocopy*: `saturate(0.68)` + `contrast(0.85)` + a 45%
`mix-blend-mode: color` wash that overwrites the photo's own hue everywhere
at once. Three separate desaturations stacked. Then `.hero-scrim` puts up to
88% ink over the bottom. The result is brown mud.

**Do not fix this by dialling sepia down a notch** — that reproduces the same
deadness at lower opacity. The direction is *vintage but alive*: rich
saturated color, deep-but-not-crushed blacks, warm highlight bloom
(halation), and visible paper fiber. A film print, not a faded scan.

The second half of the complaint — "there is no paper effect" — is literal:
the hero card is the one surface on the site with **no** `.laid-paper`
texture (globals.css:109). The rest of the page has paper; the hero doesn't.

## Tasks

### Task 1 — Rebuild the grade

- [ ] Replace `.hero-poster` filter. Target, in this order of intent:
      **saturation up, blacks deep, highlights warm.** Starting point to tune
      against the real render, not to ship blind:
      `filter: saturate(1.12) contrast(1.06) brightness(0.98) hue-rotate(-4deg);`
- [ ] Delete the `mix-blend-mode: color` wash from `.hero-grade`. A `color`
      blend replaces the photo's hue with the gradient's — that is the single
      largest cause of the sepia flatness. Rebuild `.hero-grade` as a
      **split-tone**, not a hue replacement:
      `mix-blend-mode: soft-light` with a cool-shadow → warm-highlight
      gradient at `opacity: 0.35`. Sky cools, poppies stay orange.
- [ ] Add a **halation** layer (new, above the grade, below the scrim): a
      radial `--color-poppy` glow at ~18% over the poppy field with
      `mix-blend-mode: screen`, `filter: blur(28px)`, `opacity: .5`. This is
      the "alive" cue — analog film blooms around bright warm subjects; a
      digital-flat image never does. Keep it `aria-hidden`, `pointer-events:
      none`, no animation.
- [ ] Verify each layer in isolation by toggling it in DevTools before
      committing all four. If a layer can be removed without the render
      getting worse, remove it (DESIGN.md: "if any animation needs a comment
      to justify it, delete it" — same test applies to grade layers).

### Task 2 — Give the card its paper

- [ ] Add `.laid-paper`-style ribbing **inside** the hero card, above the
      poster, below the text: reuse the existing repeating-linear-gradient
      recipe (globals.css:109-116) at a hero-appropriate strength, with
      `mix-blend-mode: overlay` so it reads as fiber in the emulsion rather
      than stripes on top.
- [ ] Reuse the `.laid-paper` class if the existing values hold at hero
      scale. Only introduce `.hero-fiber` if they measurably don't — one
      class, not a new system.
- [ ] Reconsider the double `<Grain>` in `hero.tsx:25-28`. With real fiber +
      halation the second 0.15 pass will likely be redundant noise. Drop to
      one `<Grain>` unless the side-by-side render says otherwise.

### Task 3 — Kill the copy, replace with a masthead line

- [ ] Delete the italic paragraph in `hero.tsx:45-48` verbatim ("I design
      products and build them: … Buenos Aires, working US hours."). Santiago
      named it; it goes.
- [ ] Do **not** replace it with another sentence of prose. Replace it with a
      **credit block** — the typographic move a photographer or film title
      card would use. Small caps / mono, letterspaced, hairline-ruled,
      2–3 lines max, e.g. a role line, a location line, and the live local
      time (`local-time.tsx` already exists — reuse it, do not rebuild).
- [ ] `SV:confirm` — Santiago writes the exact credit-line wording. Ship the
      typographic structure with his placeholders visible, not invented copy.

### Task 4 — Headline typography with a spine

- [ ] Keep Newsreader Italic (`.hero-headline`) — the analog redirect chose
      it deliberately and Santiago's complaint is about *color and copy*, not
      the face. Do not swap fonts.
- [ ] Upgrade the load reveal from `translateY(16px)` fade to a **masked
      line reveal** — each line rises from behind its own `overflow: hidden`
      box rather than sliding in over the photo. Type that is *revealed*
      reads as typeset; type that *slides* reads as a webpage animating.
- [ ] Use **GSAP SplitText with `mask: "lines"`** (3.13+). It wraps each
      line in the overflow container for you and, critically, **re-splits
      correctly on resize** — the hard part of this effect, and the reason
      not to hand-roll clip-path here. `linesClass` + `autoSplit: true`.
- [ ] Split by **lines only**, not characters. Per-character stagger on an
      editorial serif headline is the single most overused motion cliché on
      portfolio sites; it reads as a template. Two lines, two masks.
- [ ] 600ms, 60ms stagger, under 900ms total (DESIGN.md → Motion).
- [ ] Easing — read carefully, the token's name lies. `--ease-out-quart` is
      `cubic-bezier(0.22, 1, 0.36, 1)`, which is easeOut**Quint**. GSAP's
      `power3.out` is quart; `power4.out` is quint. So **`power4.out` is the
      match** despite the token name. For a pixel-exact match use
      `CustomEase.create("token", "0.22, 1, 0.36, 1")` (CustomEase is free
      since 3.11). Do not introduce a second easing vocabulary — Slice B's
      tilt uses `power3` deliberately (continuous damping wants a gentler
      curve than a one-shot reveal); everything else matches the token.
- [ ] Wrap in `useGSAP()`. Revert the split on cleanup (`split.revert()`).
- [ ] Reduced motion: use `gsap.matchMedia()` with
      `(prefers-reduced-motion: no-preference)` so the animation is never
      created at all under reduce — not created-then-disabled. Lines render
      at final state. Verify in DevTools → Rendering.
- [ ] FOUC guard: SplitText runs after hydration. The headline must not be
      invisible before it (`opacity: 0` in CSS = an invisible h1 for anyone
      with JS blocked or slow). Set the hidden state *from GSAP*, in the
      same tick as the split, so no-JS renders plain visible type.

### Task 5 — Re-verify contrast (blocking)

- [ ] The old scrim was measured against the *muted* image. A brighter,
      more saturated grade raises the luminance under the h1. Re-measure the
      white headline and the credit block against the new render at 375 /
      768 / 1440 px. **4.5:1 minimum, no exceptions** (CLAUDE.md).
- [ ] If it fails, fix it in `.hero-scrim`, not by re-muting the photo.

### Task 6 — Docs

- [ ] Update `DESIGN.md`'s hero-grade paragraph to describe the new
      split-tone + halation + fiber stack. Delete the "desaturated
      Kodachrome" language — it is the wrong description of the wrong look.

## Non-goals

- No shader reintroduction. The static poster stays the permanent render.
- No hover/tilt/button work — that is Slice B.
- No per-character text animation. Lines only. See Task 4.
- No GSAP for the grade. The color work is filters and blend modes; a
  tween library adds nothing to a static image.

## Acceptance criteria

- [ ] `npm run build` passes, zero type errors.
- [ ] Console clean at 375 / 768 / 1440 px.
- [ ] The italic paragraph is gone from the codebase (grep for "Buenos Aires"
      in `app/` returns nothing in the hero).
- [ ] Headline and credit block both ≥ 4.5:1, measured on the new render.
- [ ] `prefers-reduced-motion: reduce` → no hero animation at all.
- [ ] Hero LCP still the poster image; no regression in Lighthouse mobile
      (≥ 90). GSAP is ~50KB gzipped — if it moves LCP past 2.5s, the
      headline reveal is the thing that goes, not the budget.
- [ ] JS disabled → headline renders as plain visible type, not blank.
- [ ] Side-by-side before/after screenshot at 1440px in the commit body.

## Commit

`feat: hero grade rebuild - saturated split-tone, halation, paper fiber`
