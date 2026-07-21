# CLAUDE.md — Portfolio v3 (santiagovittor.online)

Personal portfolio for Santiago Vittor. Editorial, vintage-grain, shader-driven.
Deployed to Vercel → santiagovittor.online. **santiagovittor.com is the
services site** (formerly santiagovittor.store), a separate property — this
portfolio links out to it and never claims that domain.

## Source of truth (in order of authority)

1. **SPEC.md** — what to build, milestones, acceptance criteria
2. **DESIGN.md** — how it looks: tokens, grid, type, motion, shader rules
3. **ui-ux-pro-max skill** — consult ONLY for accessibility rules, anti-pattern
   checks, and pre-delivery checklists. It must NEVER override DESIGN.md tokens,
   fonts, colors, or layout. If it suggests a different style/palette, ignore it.

## Stack (do not add dependencies without asking)

- Next.js 15+ (App Router) + TypeScript strict
- Tailwind CSS v4 (tokens defined in DESIGN.md, mapped in globals.css `@theme`)
- `@paper-design/shaders-react` (already installed — READ ITS ACTUAL EXPORTS
  in node_modules before using it; do not invent component APIs)
- `motion` (framer-motion) for scroll/entrance animation
- No UI kits, no shadcn, no component libraries. Hand-rolled components only.

## Working principles (Karpathy mode)

- **Look at the data first.** Before using any library, read its README /
  type definitions in node_modules. Before styling, read DESIGN.md again.
- **Smallest change that works.** Build one section at a time. No speculative
  abstraction — don't create a component until it's used twice.
- **Keep it boring.** Prefer CSS over JS, server components over client,
  static over dynamic. `"use client"` only where interaction demands it.
- **Verify every step.** After each milestone: `npm run build` must pass with
  zero errors, then check the dev server rendering at 375 / 768 / 1440 px.
  Never stack unverified changes.
- **Delete code.** If a v1 of a section gets replaced, remove the old one
  entirely. No commented-out corpses.
- **One concern per commit.** Commit at every milestone boundary with a
  message like `M1: hero shader + editorial headline`.
- **When stuck, simplify.** If a shader/animation fights you for more than
  two attempts, ship the static fallback version and leave a `// TODO(sv):`
  note. Momentum over perfection.

## Hard rules

- All images live in `/public/images/**` and are imported via `next/image`.
  Never hotlink external images (WebGL textures from other origins taint
  the canvas and break the shader pipeline).
- Every shader/canvas has: a static fallback (its poster image or a flat
  gradient), `prefers-reduced-motion` respect, and pauses when offscreen
  (IntersectionObserver). Cap devicePixelRatio at 2.
- Performance budget: Lighthouse ≥ 90 mobile, LCP < 2.5s. The hero image is
  the LCP element — preload it, serve AVIF/WebP.
- Semantic HTML: one `<h1>`, landmarks (`header/main/footer/nav`), visible
  focus states, alt text everywhere. 4.5:1 text contrast minimum.
- No localStorage / cookies. No analytics until asked.
- Copy: sentence case, plain verbs, no filler ("Passionate about…" is banned).
  See DESIGN.md → Voice.

## Commands

```
npm run dev         # local dev
npm run build       # must pass before every commit
npm run lint        # eslint
npx tsc --noEmit    # typecheck
```

## Verification loop (run at every milestone)

1. `npm run build` → zero errors, zero type errors
2. Load in browser: check console is clean
3. Check 375px, 768px, 1440px viewports
4. Check `prefers-reduced-motion: reduce` (DevTools → Rendering)
5. Run the ui-ux-pro-max pre-delivery checklist (a11y items only)