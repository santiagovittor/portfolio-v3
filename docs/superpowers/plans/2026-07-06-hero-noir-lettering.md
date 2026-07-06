# Hero Noir-Lettering Headline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the hero `<h1>` a hand-painted 1940s noir-door-lettering treatment (white fill, thick ink outline, ink cast shadow, brush-grain texture, brush-wipe entrance) while leaving every other part of the site's type system untouched.

**Architecture:** Real text stays in the DOM for a11y/SEO. Visual layering is native CSS: `background-clip: text` + `-webkit-text-stroke` give fill+outline on one element; a `::before` pseudo-element (content from a `data-text` attribute) gives the cast shadow. Brush-grain texture and the wipe-reveal's organic edge both reuse one SVG `feTurbulence`/`feDisplacementMap` filter technique (same family already used by `grain.tsx`). No JS, no new npm dependencies.

**Tech Stack:** Next.js `next/font/google` (Rye), Tailwind v4 (`app/globals.css`), inline SVG filters/masks, plain CSS animations.

## Global Constraints

- No new npm dependencies. Font is loaded via `next/font/google` (already the site's pattern for Archivo/Newsreader), not a package install.
- Scope: `app/components/hero.tsx` h1 only. Do not change nav, body copy, buttons, or DESIGN.md's global typography tokens.
- Headline copy is fixed: `"Designing interfaces."` / `"Engineering the rest."` — do not alter the text.
- Colors: fill gradient `var(--white)` (#FAFAF7) → `#FFF9EE`; outline and cast shadow both `var(--ink)` (#141210). Never use `var(--poppy)` on the headline itself (CTA button already owns poppy; DESIGN.md bans >1 poppy element per viewport).
- Must respect `prefers-reduced-motion: reduce` — final frame renders instantly, no animation, matching the existing `.hero-word` pattern in `app/globals.css`.
- This repo has no component-level test framework wired up (Playwright is an installed devDependency with no config/specs yet — do not add a test harness as a side effect of this task). Verification is CLAUDE.md's existing loop: `npm run build` (zero errors), `npx tsc --noEmit` (zero errors), `npm run lint`, and manual browser checks at 375/768/1440px plus `prefers-reduced-motion: reduce` emulation in DevTools.
- Delete replaced code outright (no commented-out corpses): `BlurLine`, `.hero-word`, `@keyframes word-develop`, and its reduced-motion block are fully superseded and must be removed, not left dead.

---

### Task 1: Load the Rye display font

**Files:**
- Modify: `app/layout.tsx:1-16`

**Interfaces:**
- Produces: CSS custom property `--font-noir`, available globally via the `<html>` element's class list (same mechanism as `--font-archivo`/`--font-newsreader`), consumed by Task 3's CSS.

- [ ] **Step 1: Add the Rye import and font instance**

In `app/layout.tsx`, change the import on line 2 and add a new font instance after the `newsreader` block (after line 16):

```tsx
import { Archivo, Newsreader, Rye } from "next/font/google";
```

```tsx
const rye = Rye({
  variable: "--font-noir",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});
```

- [ ] **Step 2: Attach the new font variable to `<html>`**

Change line 48 from:

```tsx
      className={`${archivo.variable} ${newsreader.variable} antialiased`}
```

to:

```tsx
      className={`${archivo.variable} ${newsreader.variable} ${rye.variable} antialiased`}
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: exit code 0, no type errors, no "unknown font" errors from `next/font/google`.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: load Rye display font for hero noir lettering"
```

---

### Task 2: Swap the hero h1 markup (remove BlurLine, add layered structure)

**Files:**
- Modify: `app/components/hero.tsx:1-58`

**Interfaces:**
- Consumes: `--font-noir` from Task 1.
- Produces: DOM structure `h1.hero-noir > span.noir-line.noir-line-1[data-text] + span.noir-line.noir-line-2[data-text]`, plus a mounted `<svg>` block of filter/mask defs (ids `noir-grain`, `noir-wipe-edge`, `noir-wipe-mask-1`, `noir-wipe-mask-2`) that Task 3 and Task 4's CSS reference by `url(#id)`.

- [ ] **Step 1: Delete the `BlurLine` helper**

Remove lines 7-24 of `app/components/hero.tsx` (the whole `BlurLine` function and its preceding comment):

```tsx
// Reactbits "BlurText": each word develops from blur with a small stagger.
// Split at build time; CSS owns the animation and reduced motion.
function BlurLine({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <span className="block">
      {text.split(" ").map((word, i) => (
        <span
          key={i}
          className="hero-word"
          style={{ animationDelay: `${(from + i) * 70}ms` }}
        >
          {word}
          {" "}
        </span>
      ))}
    </span>
  );
}
```

- [ ] **Step 2: Replace the h1 contents**

Replace (current lines 54-58):

```tsx
        <h1 className="hero-headline flex-1 text-[clamp(2.25rem,6.2vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.03em] text-white">
          {/* TODO(sv): confirm headline (SPEC.md → Hero) */}
          <BlurLine text="Designing interfaces." />
          <BlurLine text="Engineering the rest." from={2} />
        </h1>
```

with:

```tsx
        <h1 className="hero-headline hero-noir flex-1 text-[clamp(2.25rem,6.2vw,5.5rem)]">
          <span className="noir-line noir-line-1" data-text="Designing interfaces.">
            Designing interfaces.
          </span>
          <span className="noir-line noir-line-2" data-text="Engineering the rest.">
            Engineering the rest.
          </span>
        </h1>
        <svg aria-hidden focusable="false" style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <filter id="noir-grain" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="noir-wipe-edge" x="-20%" y="-100%" width="140%" height="300%">
              <feTurbulence type="fractalNoise" baseFrequency="0.015 0.35" numOctaves="2" seed="4" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="28" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <mask id="noir-wipe-mask-1" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox">
              <rect className="noir-sweep noir-sweep-1" x="0" y="-1" width="1" height="3" fill="white" filter="url(#noir-wipe-edge)" />
            </mask>
            <mask id="noir-wipe-mask-2" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox">
              <rect className="noir-sweep noir-sweep-2" x="0" y="-1" width="1" height="3" fill="white" filter="url(#noir-wipe-edge)" />
            </mask>
          </defs>
        </svg>
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: exit code 0. The h1 will render unstyled (no CSS rules exist yet for `.hero-noir`/`.noir-line` until Task 3-4) — that's expected at this checkpoint.

- [ ] **Step 4: Commit**

```bash
git add app/components/hero.tsx
git commit -m "feat: replace hero BlurLine with layered noir-lettering markup"
```

---

### Task 3: Fill, contour, cast shadow, and brush texture (static look)

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `--font-noir` (Task 1), `#noir-grain` filter and DOM structure from Task 2, existing tokens `--white`, `--ink`, `--poppy`, `--ease-out-quart`.
- Produces: CSS classes `.hero-noir`, `.noir-line`, `.noir-line::before` — fully static (no animation yet; Task 4 adds the wipe). At the end of this task the headline should look like the final design, just appearing all at once on load.

- [ ] **Step 1: Delete the old `.hero-word` rules**

Remove from `app/globals.css` (the block currently at lines 280-306):

```css
/* DESIGN.md → Motion rules: headline reveals once on load.
   Reactbits BlurText: words develop from blur like ink drying,
   70ms apart, whole run under 900ms. */
.hero-word {
  display: inline-block;
  opacity: 0;
  filter: blur(10px);
  transform: translateY(0.25em);
  animation: word-develop 600ms var(--ease-out-quart) forwards;
}

@keyframes word-develop {
  to {
    opacity: 1;
    filter: blur(0);
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-word {
    opacity: 1;
    filter: none;
    transform: none;
    animation: none;
  }
}
```

- [ ] **Step 2: Add the layered noir-lettering rules**

Add this block in its place:

```css
/* Hero noir lettering (docs/superpowers/specs/2026-07-06-hero-noir-lettering-design.md).
   Fill+outline come from one element via background-clip + text-stroke;
   the cast shadow is a ::before duplicate. Brush texture reuses the
   feTurbulence/feDisplacementMap technique from grain.tsx. */
.hero-noir {
  position: relative;
  isolation: isolate;
  font-family: var(--font-noir);
  font-weight: 400;
  line-height: 0.98;
  letter-spacing: -0.01em;
}

.hero-noir::before {
  content: "";
  position: absolute;
  inset: -20% -10%;
  z-index: -2;
  background: radial-gradient(
    ellipse at 30% 60%,
    color-mix(in srgb, var(--poppy) 4%, transparent),
    transparent 70%
  );
  pointer-events: none;
}

.noir-line {
  position: relative;
  display: block;
  isolation: isolate;
  color: transparent;
  background: linear-gradient(to bottom, var(--white) 55%, #fff9ee 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-stroke: clamp(1.5px, 0.35vw, 4px) var(--ink);
  filter: url(#noir-grain);
}

.noir-line::before {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  z-index: -1;
  color: var(--ink);
  -webkit-text-stroke: 0;
  transform: translate(clamp(3px, 0.6vw, 8px), clamp(3px, 0.6vw, 8px));
}
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`, open the hero section.
Expected: headline reads in white fill with a thick dark outline and a hard offset dark shadow, at 375px, 768px, and 1440px viewport widths. Text is not blurry/illegible — the turbulence displacement should read as subtle brush waver, not distortion. If `scale="3"` on `#noir-grain` looks too aggressive or too subtle at any breakpoint, adjust that value now and re-check. If Rye's letterforms read too thin or generic for the "noir door lettering" look, swap it for `Ultra` (same `next/font/google` import pattern as Task 1, `weight: "400"`) and re-check — this was the spec's named fallback.

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat: layered fill/contour/shadow + brush texture for hero headline"
```

---

### Task 4: Brush-wipe entrance animation

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `#noir-wipe-mask-1`/`#noir-wipe-mask-2` and `.noir-sweep-1`/`.noir-sweep-2` rect elements from Task 2, `--ease-out-quart`.
- Produces: `.noir-line-1`/`.noir-line-2` masked to their respective wipe masks; `.noir-sweep` animation driving the reveal.

- [ ] **Step 1: Mask each line to its wipe mask**

Add to `app/globals.css`, right after the `.noir-line::before` rule from Task 3:

```css
.noir-line-1 {
  mask: url(#noir-wipe-mask-1);
  -webkit-mask: url(#noir-wipe-mask-1);
}
.noir-line-2 {
  mask: url(#noir-wipe-mask-2);
  -webkit-mask: url(#noir-wipe-mask-2);
}
```

- [ ] **Step 2: Add the sweep animation**

```css
/* Brush-wipe reveal: the mask's rect scales in from the left edge,
   its right boundary warped by #noir-wipe-edge so the reveal line
   looks like a brush pass, not a mechanical wipe. Mirrors the
   unconditional-then-reduced-motion-reset pattern used elsewhere
   in this file (see the old .hero-word rule this replaces). */
.noir-sweep {
  transform-origin: 0 0;
  transform: scaleX(0);
  animation: noir-wipe 500ms var(--ease-out-quart) forwards;
}

.noir-sweep-2 {
  animation-delay: 150ms;
}

@keyframes noir-wipe {
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .noir-sweep {
    transform: scaleX(1);
    animation: none;
  }
}
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev` (or reuse the already-running server), reload the hero section.
Expected: "Designing interfaces." wipes in left-to-right over ~500ms with a slightly wavy (not razor-straight) reveal edge; "Engineering the rest." starts ~150ms later. Total settle under ~900ms. Nothing else on the page animates on load.

- [ ] **Step 4: Verify reduced motion**

Chrome DevTools → Cmd/Ctrl+Shift+P → "Show Rendering" → emulate `prefers-reduced-motion: reduce`, reload.
Expected: both headline lines are fully visible immediately, no wipe, no delay.

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css
git commit -m "feat: brush-wipe entrance animation for hero headline"
```

---

### Task 5: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: exit code 0, zero errors, zero type errors.

- [ ] **Step 4: Cross-viewport visual check**

`npm run dev`, check the hero headline at 375px, 768px, and 1440px (browser DevTools device toolbar or manual window resize).
Expected: outline/shadow/gradient scale proportionally (via `clamp()`), text never clips its container, contrast against the bottom scrim holds (white fill + ink outline is strictly higher-contrast than the plain white text it replaced).

- [ ] **Step 5: Accessibility check**

In the browser, right-click the headline → Inspect, confirm the `<h1>` element's accessible name (Accessibility pane, or a screen reader) reads exactly "Designing interfaces. Engineering the rest." with no duplicated text from the `::before` shadow layers (generated content is not exposed to the accessibility tree in evergreen browsers, but confirm directly rather than assume).

- [ ] **Step 6: Reduced motion re-check**

Repeat Task 4 Step 4's DevTools emulation once more with the full page loaded, confirm no other on-load animation was accidentally affected.

- [ ] **Step 7: Final commit (only if any fixes were made in this task)**

```bash
git add -A
git commit -m "fix: address issues found in hero noir-lettering verification pass"
```
