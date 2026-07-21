# Site-Wide Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hero's floating-card-over-blurred-backdrop treatment with a paper-mat print look, make the nav's text color content-aware instead of scroll-position-aware, restyle the hero CTAs/subtext as vintage print elements, and add five small independently-cuttable "artistic surface" details across Work/About/Contact/Footer.

**Architecture:** No new dependencies, no new pages, no new client-state libraries. CSS token/rule edits in `app/globals.css`, structural JSX edits in `app/components/hero.tsx` and `app/page.tsx`, an `IntersectionObserver` rewrite in `app/components/nav.tsx`, and a one-prop extension to `app/components/grain.tsx`.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind CSS v4 (`@theme` tokens in `globals.css`), no `motion`/framer usage needed for any item here.

## Global Constraints

- No new npm dependency for anything in this plan (spec's own out-of-scope rule).
- All images already live in `/public/images/**` via `next/image` — nothing here adds a new image.
- Every visual change must keep `prefers-reduced-motion: reduce` correct — most items here are static CSS with no motion, but the hero task touches the one real scroll-driven animation (`hero-exit`) in the codebase and must not break its reduced-motion fallback.
- Nav text must hold ≥4.5:1 contrast at every scroll position (spec §3 pass/fail bar).
- No cursor followers, no tilt-on-hover, no scroll-jacking, ≤1 poppy accent per viewport (DESIGN.md anti-patterns, spec §5 explicitly reaffirms this).
- **This repo has no test framework** (confirmed: no test files, no test runner in package.json). Verification for every task in this plan is: `npm run build` (zero errors) → `npx tsc --noEmit` (zero errors) → `npm run lint` → manual browser check at 375 / 768 / 1440px → toggle DevTools "Emulate CSS prefers-reduced-motion: reduce" → check the specific pass/fail condition named in the task. This matches CLAUDE.md's own verification loop; do not invent unit tests for CSS/visual behavior.
- Decisions already made (do not re-litigate): the hero date-stamp easter egg is **dropped** (EXIF unrecoverable from the repo's source photos). All five §5 "go bigger" extras are **in scope**: ticker sprocket-rail, work-card frame-number hover, About-portrait Reveal (verify-only), Contact ticket-stub rows, footer console egg.

---

## Task 1: Hero paper-mat structural change

**Files:**
- Modify: `app/components/hero.tsx` (remove backdrop div, tag card for nav, add vignette layer, add second grain layer)
- Modify: `app/components/grain.tsx` (add `opacity` prop so a second, stronger instance can be mounted)
- Modify: `app/globals.css:16-27` (remove `--radius-hero-card`, retire its comment), `app/globals.css:165-196` (remove `.hero-backdrop`, rewrite `.hero-card`, add `.hero-vignette`)

**Interfaces:**
- Consumes: existing `Grain` component (currently no props besides `className`), existing `--hero-inset` token, existing `.hero-pin`/`.hero-stage`/`hero-exit` choreography in `app/page.tsx:35-39` and `globals.css:198-237` (untouched by this task).
- Produces: `Grain({ className, opacity })` — new optional `opacity: number` prop, default `0.06` (preserves every existing call site's behavior with zero code changes there). `.hero-card` now carries `data-nav-theme="dark"`, which Task 3's nav observer will query for.

- [ ] **Step 1: Add an `opacity` prop to `Grain`**

Current `app/components/grain.tsx`:
```tsx
export function Grain({
  className = "fixed inset-0 z-50",
}: {
  /** Positioning only; pass e.g. "absolute inset-0" to scope it to a surface */
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none opacity-[0.06] mix-blend-overlay ${className}`}
      style={{ backgroundImage: `url("${NOISE}")` }}
    />
  );
}
```

Replace with:
```tsx
export function Grain({
  className = "fixed inset-0 z-50",
  opacity = 0.06,
}: {
  /** Positioning only; pass e.g. "absolute inset-0" to scope it to a surface */
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none mix-blend-overlay ${className}`}
      style={{ backgroundImage: `url("${NOISE}")`, opacity }}
    />
  );
}
```

The old `opacity-[0.06]` Tailwind utility is replaced by an inline `style.opacity` default of the same value — every existing call site (`app/layout.tsx`'s global mount, `hero.tsx`'s existing card-scoped mount) renders identically, just via `style` instead of a class. This is what lets a second instance override it with a plain prop instead of fighting Tailwind class-order specificity.

- [ ] **Step 2: Remove the ambient backdrop and restructure `hero.tsx`**

Current `app/components/hero.tsx`:
```tsx
import Image from "next/image";
import poppies from "@/public/images/hero/poppies.jpg";
import { Grain } from "./grain";
import { HeroShader } from "./hero-shader";
import { Magnet } from "./magnet";

export function Hero() {
  return (
    <section aria-label="Intro" className="relative h-svh">
      {/* Ambient backdrop: pre-blurred, darkened 128px still of the same shot */}
      <div aria-hidden className="hero-backdrop absolute inset-0" />

      {/* The card is the viewport: everything hero lives inside it */}
      <div className="hero-card bg-sky">
        {/* Poster: LCP element and the shader's permanent fallback */}
        <Image
          src={poppies}
          alt="Field of orange poppies against a blue sky"
          fill
          priority
          sizes="100vw"
          className="hero-poster object-cover"
        />
        {/* Card-scoped grain matches the shader's fiber so the swap is silent */}
        <Grain className="absolute inset-0" />
        <HeroShader image="/images/hero/poppies-1920.jpg" />

        {/* Contrast scrim, not decoration: guarantees 4.5:1 for white type */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/60 to-transparent"
        />
```

Replace the opening of the function through the scrim div with:
```tsx
export function Hero() {
  return (
    <section aria-label="Intro" className="relative h-svh bg-paper">
      {/* The card is a photograph mounted in a paper mat: --hero-inset is
          the mat width, exposing bg-paper around the card's sharp corners. */}
      <div data-nav-theme="dark" className="hero-card bg-sky">
        {/* Poster: LCP element and the shader's permanent fallback */}
        <Image
          src={poppies}
          alt="Field of orange poppies against a blue sky"
          fill
          priority
          sizes="100vw"
          className="hero-poster object-cover"
        />
        {/* Card-scoped grain matches the shader's fiber so the swap is silent */}
        <Grain className="absolute inset-0" />
        <HeroShader image="/images/hero/poppies-1920.jpg" />
        {/* Second, heavier grain layer: the 0.06 site-wide pass reads too
            subtle at hero scale on its own (validated against renders). */}
        <Grain className="absolute inset-0" opacity={0.15} />
        {/* Vignette: darkens toward the corners like a physical print */}
        <div aria-hidden className="hero-vignette absolute inset-0" />

        {/* Contrast scrim, not decoration: guarantees 4.5:1 for white type */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/60 to-transparent"
        />
```

The rest of the file (headline, subtext block, buttons, closing tags) is untouched by this step — Task 2 edits the subtext/button classes separately.

- [ ] **Step 3: Update `globals.css` tokens — remove `--radius-hero-card`**

Current `app/globals.css:16-27`:
```css
  /* Radius system: two shapes site-wide plus one singleton.
     Print surfaces (photos, covers, plates) are square-cornered like a
     magazine spread; everything interactive is a full pill; the hero card
     alone gets a soft corner (DESIGN.md → Radii → hero card). */
  --radius-pill: 999px;
  --radius-hero-card: 20px;

  /* Hero card inset from the viewport edges */
  --hero-inset: clamp(16px, 3vw, 48px);

  --ease-out-quart: cubic-bezier(0.22, 1, 0.36, 1);
}
```

Replace with:
```css
  /* Radius system: exactly two shapes site-wide (DESIGN.md → Radii).
     Print surfaces (photos, covers, plates, the hero card) are square-
     cornered; everything interactive is a full pill, except the hero
     CTAs which use --radius-ticket (documented exception, added in the
     visual-polish pass — see DESIGN.md). */
  --radius-pill: 999px;
  --radius-ticket: 3px;

  /* Hero mat: width of the paper border exposed around the card */
  --hero-inset: clamp(16px, 3vw, 48px);

  --ease-out-quart: cubic-bezier(0.22, 1, 0.36, 1);
}
```

(`--radius-ticket` is introduced here because Task 2 needs it — declaring it alongside the token it replaces keeps the `@theme` block's diff self-contained.)

- [ ] **Step 4: Rewrite `.hero-backdrop`/`.hero-card` in `globals.css`**

Current `app/globals.css:165-196`:
```css
/* Card-framed hero: an ambient blurred still of the same shot behind
   everything, the live card floating on top, inset from the viewport. */
.hero-backdrop {
  background-image: url("/images/hero/poppies-blur.jpg");
  background-size: cover;
  background-position: center;
  /* Darkening/desaturation is baked into the 128px asset at build time */
  transform: scale(1.15);
}
.hero-card {
  position: absolute;
  inset: var(--hero-inset);
  border-radius: var(--radius-hero-card);
  overflow: hidden;
  box-shadow: 0 32px 80px -16px color-mix(in srgb, var(--color-ink) 45%, transparent);
}
/* Hairline drawn above the card's content so it survives the imagery */
.hero-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 30;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-white) 15%, transparent);
  pointer-events: none;
}
/* Nav is fixed (it must persist over the paper sections) but padded to
   sit inside the card frame while the hero is on screen. */
.nav-frame {
  padding: calc(var(--hero-inset) + 12px);
  padding-bottom: 0;
}
```

Replace with:
```css
/* Paper-mat hero: the photo sits sharp-cornered inside a bg-paper mat
   (the hero <section>'s own background, exposed around the card via
   --hero-inset), like a print mounted on a page — not a floating panel. */
.hero-card {
  position: absolute;
  inset: var(--hero-inset);
  overflow: hidden;
}
/* Hairline drawn above the card's content so it survives the imagery —
   same ink/15% hairline as .plate, since the hero card now belongs to
   that shape category (DESIGN.md → Radii). */
.hero-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 30;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-ink) 15%, transparent);
  pointer-events: none;
}
/* Subtle radial darkening toward the corners, over the image, under the
   text/scrim layer — reads as a physical print, not a filter. */
.hero-vignette {
  background: radial-gradient(
    ellipse at center,
    transparent 55%,
    color-mix(in srgb, var(--color-ink) 45%, transparent) 100%
  );
  mix-blend-mode: multiply;
}
/* Nav is fixed (it must persist over the paper sections) but padded to
   sit inside the mat while the hero is on screen. */
.nav-frame {
  padding: calc(var(--hero-inset) + 12px);
  padding-bottom: 0;
}
```

- [ ] **Step 5: Build and typecheck**

Run: `npm run build`
Expected: zero errors, zero type errors. If `next build` complains about the now-unused `--radius-hero-card` reference anywhere else, grep for it:

Run: `grep -rn "radius-hero-card\|hero-backdrop" app/`
Expected: no matches (confirms the removal is complete — nothing else in the codebase referenced these).

- [ ] **Step 6: Manual browser verification (this is the real test for this task)**

Start dev server: `npm run dev`

At 1440px, 768px, 375px, scroll from the top through the full hero-to-work transition and confirm:
1. The hero card has sharp (0-radius) corners with a thin dark hairline, sitting inside a visible `bg-paper` (`#efeae1`) mat border on all sides.
2. No visual "gap" or flash of unstyled background appears around the card as you scroll through the `hero-exit` scale-down (card should shrink slightly into the mat, exposing slightly more paper at the edges — this is the intended look, not a bug).
3. The vignette is a subtle darkening at the four corners of the card, not visible as a hard edge or banding.
4. Open DevTools → Rendering → enable "Emulate CSS media feature prefers-reduced-motion: reduce". Reload. Confirm: `.hero-stage` has `height: auto`, the hero renders as a normal (non-pinned) full-height section, `.work-sheet` has no negative margin, and the card still shows the mat/vignette/grain treatment correctly in this static layout.
5. Confirm the shader still mounts: wait ~1s or move the mouse over the hero; the shader should crossfade in over the poster exactly as before (this task didn't touch `hero-shader.tsx` or reorder anything the shader's `firstElementChild` lookup depends on, but confirm visually since the DOM around it changed).

Pass/fail: all five hold at all three breakpoints and in both motion states. If (2) fails (a paper gap flashes during scale-down), the fix is to move `bg-paper` from the `<section>` onto a new wrapper that scales together with `.hero-card` — do not proceed to Task 2 until this is resolved, since it's the one genuinely new interaction between old choreography and new structure.

- [ ] **Step 7: Mobile nav seam check (spec §2 — resolved as a consequence of this task)**

At 390×844 (iPhone 12/13 viewport in DevTools), confirm the nav pill floats cleanly inside the paper mat with clear visual separation from the card's now-sharp top edge — there should be no curved-edge collision (the original bug was two ~20px-radius curves meeting at close range; the card has no radius now, so there's nothing to clash against).

Pass/fail: comfortable breathing room, no visual collision. If the gap looks tight, adjust the `12px` constant in `.nav-frame`'s padding (`app/globals.css`, the rule touched in Step 4) — do not add a new component for this (spec explicitly rules out a dedicated "museum tag" component here).

- [ ] **Step 8: Commit**

```bash
git add app/components/hero.tsx app/components/grain.tsx app/globals.css
git commit -m "feat: hero paper-mat treatment, remove floating-card radius"
```

---

## Task 2: Hero buttons + subtext vintage treatment

**Files:**
- Modify: `app/components/hero.tsx` (button classes, subtext class)
- Modify: `app/globals.css` (add `.btn-letterpress`, append radius rewrite to DESIGN.md-mirrored comment — no new CSS block needed beyond the letterpress shadow since radius/uppercase/tracking are Tailwind utilities)
- Modify: `DESIGN.md:52-59` (radius section — final end-state text, now that both the hero-card-as-plate change from Task 1 and the button-as-ticket change from this task both exist)

**Interfaces:**
- Consumes: `--radius-ticket` token added in Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the letterpress shadow class to `globals.css`**

Append after the `.btn` block at the end of `app/globals.css` (currently lines 567-587, the file's last rule):
```css

/* Poppy CTA reads pressed-into-paper, not flat (DESIGN.md → Buttons). */
.btn-letterpress {
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--color-white) 25%, transparent),
    inset 0 -2px 0 color-mix(in srgb, var(--color-ink) 25%, transparent);
}
```

- [ ] **Step 2: Restyle the buttons and subtext in `hero.tsx`**

Current (end of `app/components/hero.tsx`):
```tsx
        <div className="max-w-xs shrink-0">
          <p className="text-white/90">
            I design products and build them: interfaces, frontends, and the
            AI behind them. Buenos Aires, working US hours.
          </p>
          <div className="mt-6 flex gap-3">
            <Magnet>
              <a
                href="#work"
                className="btn block rounded-full bg-poppy px-6 py-3 font-medium text-ink hover:bg-poppy/90"
              >
                See the work
              </a>
            </Magnet>
            <Magnet>
              <a
                href="#contact"
                className="btn block rounded-full border border-white/25 bg-white/12 px-6 py-3 font-medium text-white backdrop-blur-md hover:bg-white/20"
              >
                Get in touch
              </a>
            </Magnet>
          </div>
        </div>
```

Replace with:
```tsx
        <div className="max-w-xs shrink-0">
          <p className="font-serif text-lg italic text-white/90">
            I design products and build them: interfaces, frontends, and the
            AI behind them. Buenos Aires, working US hours.
          </p>
          <div className="mt-6 flex gap-3">
            <Magnet>
              <a
                href="#work"
                className="btn btn-letterpress block rounded-[var(--radius-ticket)] bg-poppy px-6 py-2.5 text-sm font-medium uppercase tracking-[0.06em] text-ink hover:bg-poppy/90"
              >
                See the work
              </a>
            </Magnet>
            <Magnet>
              <a
                href="#contact"
                className="btn block rounded-[var(--radius-ticket)] border border-white/25 bg-white/12 px-6 py-2.5 text-sm font-medium uppercase tracking-[0.06em] text-white backdrop-blur-md hover:bg-white/20"
              >
                Get in touch
              </a>
            </Magnet>
          </div>
        </div>
```

- [ ] **Step 3: Rewrite the DESIGN.md radius section**

Current `DESIGN.md:52-59`:
```markdown
- Radii: two shapes site-wide plus one singleton. Print surfaces (photos,
  covers, plates) are square-cornered with a 1px ink/15% hairline (`.plate`),
  like plates mounted on a magazine page; interactive elements (nav, buttons,
  tags) are full pills (999px) — the **hero card** alone uses
  `--radius-hero-card: 20px` — the one soft corner, reserved for the framed
  hero floating over its ambient backdrop. Nothing else in between. Nested
  pills keep a uniform inset (nav container `p-1`) so curvature reads
  concentric.
```

Replace with:
```markdown
- Radii: exactly two shapes site-wide. Print/photographic surfaces (photos,
  covers, plates, and the hero card) are square-cornered with a 1px
  ink/15% hairline (`.plate`), like plates mounted on a magazine page;
  interactive elements (nav, buttons, tags) are full pills (999px) —
  except the hero CTAs, which use `--radius-ticket: 3px` instead, a
  documented, named exception: a full pill at button size reads as
  default rounded UI, the small radius reads as a printed ticket/stamp
  label instead. Nested pills keep a uniform inset (nav container `p-1`)
  so curvature reads concentric.
```

- [ ] **Step 4: Build and typecheck**

Run: `npm run build`
Expected: zero errors.

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 5: Manual browser verification**

At 1440px, 768px, 375px:
1. Both hero buttons show small (~3px) sharp-ish corners, uppercase text, visible letter-spacing, smaller than the subtext body copy.
2. The poppy "See the work" button shows a subtle pressed-in highlight/shadow (letterpress) — most visible on hover/close inspection, not a heavy 3D effect.
3. The subtext paragraph ("I design products...") renders in the Newsreader italic serif, distinct from the sans-serif headline and buttons.
4. Contrast: white button text on the translucent "Get in touch" button, and ink text on the poppy button, both still read clearly against the hero photo.

Pass/fail: all four hold at all three breakpoints.

- [ ] **Step 6: Commit**

```bash
git add app/components/hero.tsx app/globals.css DESIGN.md
git commit -m "feat: vintage ticket-button and Newsreader-italic subtext treatment"
```

---

## Task 3: Nav content-aware dark-zone detection

**Files:**
- Modify: `app/components/nav.tsx` (replace scroll-threshold `useEffect` with `IntersectionObserver`)
- Modify: `app/page.tsx` (tag the About portrait `.plate`)
- Modify: `app/components/work.tsx` (tag only the genuinely-dark project covers)

**Interfaces:**
- Consumes: `data-nav-theme="dark"` attribute — added to `.hero-card` in Task 1, added to the About portrait and two Work covers in this task.
- Produces: nothing consumed by later tasks.

**Note on scope (verified against the actual images, not the spec's wording alone):** the three work-tile covers are `store-landing.png` (dark space-themed screenshot — genuinely dark), `dubanronald-landing.jpg` (cream/light background — **not** dark), `canvass-outreach.png` (dark app-UI screenshot — genuinely dark). Only the first and third get tagged. Tagging the light one would flip the nav to unreadable white-on-light exactly when it scrolls past — the failure mode this whole task exists to prevent.

- [ ] **Step 1: Rewrite `nav.tsx`'s theme detection**

Current `app/components/nav.tsx:1-30`:
```tsx
"use client";

import { useEffect, useState } from "react";

/**
 * Glass on the hero, ink-on-glass once the work sheet covers it
 * (DESIGN.md → Scroll transition). Cover completes at 100svh of scroll.
 * variant="paper" pins the ink style for pages without a hero.
 */
export function Nav({ variant = "hero" }: { variant?: "hero" | "paper" }) {
  const [scrolled, setScrolled] = useState(false);
  const onPaper = variant === "paper" || scrolled;

  useEffect(() => {
    if (variant === "paper") return;
    let raf = 0;
    const check = () => {
      raf = 0;
      setScrolled(window.scrollY > window.innerHeight * 0.9);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [variant]);
```

Replace with:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Glass over anything tagged data-nav-theme="dark", ink-on-glass everywhere
 * else (DESIGN.md → Scroll transition). Content-aware, not scroll-position-
 * aware: an IntersectionObserver watches every data-nav-theme="dark"
 * element in the document and flips theme based on how many currently
 * intersect the fixed nav's own height band at the top of the viewport.
 * variant="paper" pins the ink style for pages without a hero.
 */
export function Nav({ variant = "hero" }: { variant?: "hero" | "paper" }) {
  const [onDark, setOnDark] = useState(variant === "hero");
  const headerRef = useRef<HTMLElement>(null);
  const onPaper = variant === "paper" || !onDark;

  useEffect(() => {
    if (variant === "paper") return;
    const header = headerRef.current;
    if (!header) return;

    const intersecting = new Set<Element>();
    let observer: IntersectionObserver | null = null;

    const setup = () => {
      observer?.disconnect();
      intersecting.clear();
      const navHeight = header.offsetHeight;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              intersecting.add(entry.target);
            } else {
              intersecting.delete(entry.target);
            }
          }
          setOnDark(intersecting.size > 0);
        },
        {
          rootMargin: `0px 0px -${window.innerHeight - navHeight}px 0px`,
          threshold: 0,
        }
      );
      document
        .querySelectorAll('[data-nav-theme="dark"]')
        .forEach((el) => observer!.observe(el));
    };

    setup();
    window.addEventListener("resize", setup);
    return () => {
      window.removeEventListener("resize", setup);
      observer?.disconnect();
    };
  }, [variant]);
```

Then add the ref to the `<header>` element further down in the same file. Current:
```tsx
    <header className="nav-frame fixed inset-x-0 top-0 z-40 flex items-center justify-between transition-colors duration-300">
```
Replace with:
```tsx
    <header
      ref={headerRef}
      className="nav-frame fixed inset-x-0 top-0 z-40 flex items-center justify-between transition-colors duration-300"
    >
```

Everything else in `nav.tsx` (the `glass`/`text`/`hover`/`base` derivations and the JSX below the header tag) is unchanged — they already read from `onPaper`, which now derives from `onDark` instead of `scrolled`.

- [ ] **Step 2: Tag the About portrait**

In `app/page.tsx`, current (line 68):
```tsx
                <div className="plate overflow-hidden">
```
Replace with:
```tsx
                <div data-nav-theme="dark" className="plate overflow-hidden">
```

- [ ] **Step 3: Tag only the genuinely-dark work covers**

In `app/components/work.tsx`, add a `dark` field to the `Project` type and set it on the two dark covers only:

Current:
```tsx
type Project = {
  slug: string;
  name: string;
  outcome: string;
  tags: string[];
  cover: StaticImageData;
  alt: string;
  year: string;
};

const projects: Project[] = [
  {
    slug: "santiagovittor-store",
    name: "santiagovittor.store",
    outcome:
      "Services site with an AI assistant that qualifies leads and books calls.",
    tags: ["Positioning", "AI assistant", "Conversion copy"],
    cover: storeLanding,
    alt: "Homepage of santiagovittor.store",
    year: "2025",
  },
  {
    slug: "dubanronald",
    name: "dubanronald.com",
    outcome: "Paid media agency site, designed and shipped end to end.",
    tags: ["Design", "Frontend", "Meta CAPI"],
    cover: dubanronaldLanding,
    alt: "Homepage of dubanronald.com",
    year: "2025",
  },
  {
    slug: "canvass",
    name: "Canvass",
    outcome: "Prospecting tool that maps, scores and emails local business leads.",
    tags: ["Node", "React", "Gemini"],
    cover: canvassOutreach,
    alt: "Outreach queue of Canvass with a drafted cold email",
    year: "2026",
  },
];
```

Replace with:
```tsx
type Project = {
  slug: string;
  name: string;
  outcome: string;
  tags: string[];
  cover: StaticImageData;
  alt: string;
  year: string;
  /** True for covers dark enough to need the nav to flip to white text. */
  dark?: boolean;
};

const projects: Project[] = [
  {
    slug: "santiagovittor-store",
    name: "santiagovittor.store",
    outcome:
      "Services site with an AI assistant that qualifies leads and books calls.",
    tags: ["Positioning", "AI assistant", "Conversion copy"],
    cover: storeLanding,
    alt: "Homepage of santiagovittor.store",
    year: "2025",
    dark: true,
  },
  {
    slug: "dubanronald",
    name: "dubanronald.com",
    outcome: "Paid media agency site, designed and shipped end to end.",
    tags: ["Design", "Frontend", "Meta CAPI"],
    cover: dubanronaldLanding,
    alt: "Homepage of dubanronald.com",
    year: "2025",
  },
  {
    slug: "canvass",
    name: "Canvass",
    outcome: "Prospecting tool that maps, scores and emails local business leads.",
    tags: ["Node", "React", "Gemini"],
    cover: canvassOutreach,
    alt: "Outreach queue of Canvass with a drafted cold email",
    year: "2026",
    dark: true,
  },
];
```

Then in the same file's JSX, current:
```tsx
                <div className="tile-cover plate relative overflow-hidden">
```
Replace with:
```tsx
                <div
                  className="tile-cover plate relative overflow-hidden"
                  data-nav-theme={p.dark ? "dark" : undefined}
                >
```

- [ ] **Step 4: Build and typecheck**

Run: `npm run build`
Expected: zero errors.

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 5: Manual browser verification — this task's real pass/fail bar**

At 1440px (desktop, where the About/Work grids split into columns — this is the case that matters, per the note below):

1. Scroll slowly from the top of the page to the bottom. At every scroll position, read the nav text (SV logo, Work/About/Contact links, Get in touch). It must be legible (dark text on light backgrounds, white text on dark backgrounds) the entire way — not just in the hero and generic paper areas.
2. Specifically stop with the About portrait intersecting the nav band. Check **all three** nav elements (left logo, center pill, right "Get in touch"), not just the one nearest the portrait — the portrait is `md:col-span-4` (left third of the section only) at this width, so the dark tag might flip the *entire* nav to white while most of the nav's real estate is actually still over light paper.
3. Do the same check scrolling past both dark work-tile covers (`store-landing`, `canvass`) and past the light one (`dubanronald`) — confirm the light one does **not** flip the nav.

**If step 2 fails** (nav unreadable over light paper because the whole nav flipped white for a partial-width dark element): remove the `data-nav-theme="dark"` attribute from the About portrait `.plate` added in Step 2, and leave the mechanism covering the hero card and the two dark work covers only — those are full-bleed-width, which is the case this global on/off signal can correctly represent. Do not build per-element/zone-aware nav logic to fix it; that's a materially bigger feature than the spec asked for. Re-run this verification step after removing the tag to confirm the nav degrades to always-ink (readable) over that section instead.

At 375px/390px, re-check the same scroll pass — About and Work stack to full width on mobile, so the partial-width concern doesn't apply there; confirm legibility holds regardless of whichever decision was made above for desktop.

- [ ] **Step 6: Commit**

```bash
git add app/components/nav.tsx app/page.tsx app/components/work.tsx
git commit -m "feat: content-aware nav contrast via IntersectionObserver"
```

(If Step 5 required removing the portrait tag, that's part of this same commit — it's a correction discovered during this task's own verification, not a separate task.)

---

## Task 4: Work section — sprocket-hole rail + frame-number hover

**Files:**
- Modify: `app/components/work.tsx` (add frame-number span per project tile)
- Modify: `app/globals.css` (add `.ticker::before` sprocket rail, add `.frame-number` rule, extend the existing reduced-motion transition-reset list)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the sprocket-hole rail to the ticker strip**

Append to `app/globals.css`, near the existing `.ticker`/`.ticker-track` rules (currently lines 423-442):
```css
/* Sprocket-hole rail: filmstrip motif along the ticker's top edge,
   reinforcing the grain/paper "print" system (spec §5). */
.ticker::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 6px;
  background-image: repeating-radial-gradient(
    circle at 6px 3px,
    color-mix(in srgb, var(--color-ink) 25%, transparent) 0 2px,
    transparent 2.5px 14px
  );
}
```
No JSX change needed — `app/components/work.tsx`'s ticker div already has `className="ticker relative border-b ..."`, and `position: relative` is required for the `::before` to anchor correctly, which it already has.

- [ ] **Step 2: Add a frame-number label to each work tile cover**

In `app/components/work.tsx`, current:
```tsx
                <div
                  className="tile-cover plate relative overflow-hidden"
                  data-nav-theme={p.dark ? "dark" : undefined}
                >
                  <ViewTransition name={`cover-${p.slug}`}>
                    <Image
                      src={p.cover}
                      alt={p.alt}
                      sizes="(min-width: 1024px) 30vw, 90vw"
                      className="aspect-[4/3] object-cover object-top"
                    />
                  </ViewTransition>
                </div>
```
Replace with:
```tsx
                <div
                  className="tile-cover plate relative overflow-hidden"
                  data-nav-theme={p.dark ? "dark" : undefined}
                >
                  <ViewTransition name={`cover-${p.slug}`}>
                    <Image
                      src={p.cover}
                      alt={p.alt}
                      sizes="(min-width: 1024px) 30vw, 90vw"
                      className="aspect-[4/3] object-cover object-top"
                    />
                  </ViewTransition>
                  <span
                    aria-hidden
                    className="frame-number absolute bottom-2 right-2 rounded-[2px] bg-ink/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-white/80"
                  >
                    {String(i + 1).padStart(2, "0")}A
                  </span>
                </div>
```
(`i` is already in scope — it's the `.map((p, i) => ...)` index used two lines above for `--reveal-delay`.)

- [ ] **Step 3: Wire up the hover fade and reduced-motion reset**

Append to `app/globals.css`, near `.tile-arrow` (currently lines 476-490):
```css
/* Frame number: contact-sheet-style label, fades in on hover/focus. */
.frame-number {
  opacity: 0;
  transition: opacity 300ms var(--ease-out-quart);
}
.tile:hover .frame-number,
.tile:focus-visible .frame-number {
  opacity: 1;
}
```

Then extend the existing reduced-motion reset block. Current `app/globals.css:511-518`:
```css
@media (prefers-reduced-motion: reduce) {
  .index-row,
  .tile-arrow,
  .tile-cover img,
  .link-draw {
    transition: none;
  }
}
```
Replace with:
```css
@media (prefers-reduced-motion: reduce) {
  .index-row,
  .tile-arrow,
  .tile-cover img,
  .link-draw,
  .frame-number {
    transition: none;
  }
}
```

- [ ] **Step 4: Build and typecheck**

Run: `npm run build`
Expected: zero errors.

- [ ] **Step 5: Manual browser verification**

At 1440px and 768px:
1. The ticker strip (between hero and Work heading) shows a thin row of small dark dots along its top edge.
2. Hovering (or tab-focusing) a work tile fades in a small `01A`/`02A`/`03A`-style label at the cover's bottom-right corner; it's gone when not hovered/focused.
3. Toggle reduced-motion: the label still appears/disappears on hover (just without an animated fade — instant), not stuck permanently visible or invisible.

Pass/fail: all three hold.

- [ ] **Step 6: Commit**

```bash
git add app/components/work.tsx app/globals.css
git commit -m "feat: work section sprocket-hole rail and frame-number hover"
```

---

## Task 5: Contact ticket-stub rows

**Files:**
- Modify: `app/globals.css` (extend the existing `.index-row` rule with clipped corners + tint)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the clipped-corner treatment**

Current `app/globals.css:492-497`:
```css
/* Contact index rows: label shifts, arrow surfaces, hairline warms. */
.index-row {
  transition:
    border-color 300ms var(--ease-out-quart),
    padding-left 300ms var(--ease-out-quart);
}
```
Replace with:
```css
/* Contact index rows: label shifts, arrow surfaces, hairline warms.
   Clipped corners are the ticket-stub motif that lost the hero corner
   decision (spec §5) — right-sized here on a small link row instead. */
.index-row {
  clip-path: polygon(
    0 0,
    calc(100% - 10px) 0,
    100% 10px,
    100% 100%,
    10px 100%,
    0 calc(100% - 10px)
  );
  background: color-mix(in srgb, var(--color-ink) 4%, transparent);
  transition:
    border-color 300ms var(--ease-out-quart),
    padding-left 300ms var(--ease-out-quart);
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: zero errors.

- [ ] **Step 3: Manual browser verification**

At 1440px, 768px, 375px: the Contact section's list rows (WhatsApp/LinkedIn/GitHub/Services site) show a faint tint with two opposite corners (top-right, bottom-left) cut at a diagonal — a ticket-stub silhouette. Row text is not clipped (the 10px corner cut is small enough not to touch the label/arrow/note text given existing row padding). Hover still shows the existing poppy border + padding-left shift.

Pass/fail: corners visibly clipped, no text touched by the clip, hover behavior unchanged.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: ticket-stub clipped corners on contact index rows"
```

---

## Task 6: Footer console easter egg

**Files:**
- Modify: `app/page.tsx` (add one inline `<script>` in the footer)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Add the script**

Current `app/page.tsx:173` (footer opening tag) area — insert immediately before the closing `</footer>`:
```tsx
          <footer className="relative flex flex-wrap items-center justify-between gap-4 border-t border-shadow-ink/20 px-5 py-8 md:px-16">
            <p className="font-medium">Santiago Vittor</p>
            <p className="text-sm text-shadow-ink">
              <span className="font-serif italic">{new Date().getFullYear()}</span>
              {" "}· Designed and built by me ·{" "}
              <a
                href="https://github.com/santiagovittor/portfolio-v3"
                className="link-draw"
              >
                View source
              </a>
            </p>
            <script
              dangerouslySetInnerHTML={{
                __html: `console.log("%cBuilt frame by frame.\\nSource: https://github.com/santiagovittor/portfolio-v3", "font-family: monospace; color: #e86a17;");`,
              }}
            />
          </footer>
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: zero errors.

- [ ] **Step 3: Manual browser verification**

Open the deployed/dev page, open DevTools console. Confirm the styled message appears exactly once on page load, with zero visible layout change to the footer.

Pass/fail: message logs, no layout shift, no console errors.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: footer console easter egg"
```

---

## Task 7: Site-wide final verification pass

**Files:** none modified — this task only verifies.

- [ ] **Step 1: Full build/typecheck/lint**

```bash
npm run build
npx tsc --noEmit
npm run lint
```
Expected: all three exit clean.

- [ ] **Step 2: About-portrait Reveal — confirm already satisfied**

Open `app/page.tsx` and confirm the About portrait `<figure>` (the one with `data-nav-theme="dark"` added in Task 3) is still inside the `<Reveal className="grid items-start gap-10 md:grid-cols-12 md:gap-6">` wrapper and still carries the `reveal-item` class. This item from spec §5 needs no code change — it was already true before this plan started (the figure is `className="reveal-item relative md:col-span-4"` inside that `Reveal`). In the browser, scroll to the About section from below and confirm the portrait fades/rises in once, the same way the Work section cards do.

- [ ] **Step 3: Full-page scroll sweep at all three breakpoints**

At 375px, 768px, 1440px, scroll the entire page top to bottom and confirm:
- Hero mat/vignette/grain/buttons/subtext (Tasks 1-2) all render correctly.
- Nav text stays legible the entire way (Task 3's pass/fail bar, re-confirmed after all other tasks landed — a later task could theoretically have changed a background this depends on, though none in this plan do).
- Ticker sprocket rail and work-card frame numbers (Task 4).
- Contact ticket-stub rows (Task 5).
- Footer console log (Task 6), no layout shift.

- [ ] **Step 4: `prefers-reduced-motion: reduce` sweep**

Toggle DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce", reload, repeat the scroll sweep at 1440px. Confirm no motion-only feature (hero-exit scale, ticker scroll, tile-cover zoom, frame-number/index-row transitions) leaves anything in a broken or half-transitioned visual state — everything should either show its static end-state or have its transition simply removed, never stuck mid-animation.

- [ ] **Step 5: Report**

No commit for this task (nothing changed). If any check in Steps 2-4 fails, go back to the task that owns that file and fix it there — do not patch it ad hoc from this verification task.
