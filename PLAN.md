# PLAN.md — Visual impact pass: wet ink, ink-morph navigation, press registration

Three features, approved 2026-07-03. Implement in order M7 → M8 → M9, one
commit per milestone, full verification loop (CLAUDE.md) at each gate.
Zero new dependencies: everything uses `@paper-design/shaders-react`
(already installed) or native browser APIs.

Read SPEC.md, DESIGN.md, and CLAUDE.md before starting. All hard rules
there still apply. This plan amends DESIGN.md in two places (see §0).

---

## 0. DESIGN.md amendments (do these edits first, same commit as M7)

1. **Shader rules.** Replace "One shader instance on the whole site: the
   hero" with: "One *live* shader per viewport. The hero owns the sky;
   work plates may each mount a `HalftoneCmyk` filter, but they are static
   renders (speed 0), pause offscreen, and degrade to the plain photo."
2. **Motion rules.** Add: "Section headings print with a brief CMYK
   misregistration that resolves to ink as they enter view (M9). End state
   is always the plain ink heading; the fringe never persists."

Also note in DESIGN.md → Scroll transition that case study navigation
morphs via the View Transitions API (M8), reduced-motion serves instant
navigation.

---

## M7 — "Wet ink" work plates (halftone-to-photo)

### Concept

Work covers at rest render as CMYK newsprint halftone in the brand inks on
paper stock — unprinted plates in a magazine. On hover (desktop) or on
scroll-into-view (touch), the ink resolves into the full photograph.
The photograph is the base layer and the permanent fallback; the halftone
is an enhancement painted on top. If WebGL is missing, JS is off, or
reduced motion is on, the site looks exactly like it does today.

### Verified API (read these files again before coding — do not guess)

- `node_modules/@paper-design/shaders-react/dist/index.d.ts` — exports
  `HalftoneCmyk`, `halftoneCmykPresets` (includes `newspaper`,
  `vintagePreset`).
- `node_modules/@paper-design/shaders/dist/shaders/halftone-cmyk.d.ts` —
  `HalftoneCmykParams`: `image` (string URL), `colorBack`, `colorC`,
  `colorM`, `colorY`, `colorK` (CSS color strings), `size`, `contrast`,
  `softness`, `grainSize`, `grainMixer`, `grainOverlay`, `gridNoise`,
  per-channel `flood*`/`gain*` (-1 to 1), `type` (`"dots" | "ink" | "sharp"`),
  plus sizing (`fit`, `scale`) and motion (`speed`) params.
- The existing mount-gating pattern lives in `app/components/hero-shader.tsx`
  (wake events, WebGL2 check, `paperShaderMount` ready-poll, give-up
  deadline). Reuse its ideas; extract shared helpers only if it stays
  simple — do not force an abstraction.

Docs: https://shaders.paper.design/ (halftone-cmyk page has a live prop
playground — useful for tuning values before hardcoding).

### Palette mapping (stay inside DESIGN.md tokens)

- `colorBack` → `#EFEAE1` (paper)
- `colorK` → `#141210` (ink)
- `colorC` → `#3D8BD9` (sky stands in for cyan)
- `colorM` → `#E86A17` (poppy stands in for magenta) — dots are small and
  mixed, this does not violate the one-poppy-per-viewport rule; the
  resolved state has no poppy at all
- `colorY` → either transparent/omitted or a desaturated warm neutral;
  tune by eye. If four inks read as noisy, drop to sky + ink duotone
  (`floodM`/`floodY` at -1 or transparent colors) — the reference is
  newsprint, not a rainbow.

Start from the `newspaper` preset and adjust. Keep `type: "dots"`,
`speed: 0` (static render — halftone needs no animation).

### Implementation steps

1. **`app/components/plate-halftone.tsx`** (`"use client"`). Props:
   `{ image: string }` (a public URL for the same cover, e.g. a resized
   `/images/projects/store-1200.jpg` — the shader takes a URL, not a
   StaticImageData; generate 1200px-wide JPGs for the three covers under
   `public/images/projects/` if not present).
   - Renders `HalftoneCmyk` absolutely positioned over the card's
     `next/image`, `aria-hidden`, `pointer-events-none`.
   - Mount gate: WebGL2 support + IntersectionObserver (mount when the
     card is near viewport, unmount/pause when far) + respect
     `prefers-reduced-motion` (never mount; photo shows as today).
   - Ready gate: poll `paperShaderMount` like hero-shader.tsx does; fade
     the canvas in only after first frame (no pop-in), give up after a
     deadline and stay on the photo.
   - Cap render size like the hero does (`maxPixelCount`), DPR ≤ 2.
2. **Resolve interaction (CSS owns it).** The canvas sits at opacity 1;
   `.tile:hover` / `.tile:focus-visible` / `.tile.is-resolved` drives it
   to opacity 0 over ~500ms `--ease-out-quart`, revealing the photo. The
   existing 900ms cover-creep on hover still applies to the photo beneath —
   ink lifts, photo breathes. Nice.
3. **Touch/mobile.** No hover: an IntersectionObserver in the tile adds
   `.is-resolved` once when the card crosses ~60% viewport visibility.
   One-way, no re-triggering (same policy as `reveal.tsx`).
4. **Wire into `app/components/work.tsx`.** Add the halftone layer inside
   `.tile-cover .plate` per card. Keep the `next/image` exactly as is
   (it remains the loaded/indexed/alt-texted element).
5. **Optional flourish, only if the crossfade feels flat:** animate
   `softness`/`size` props with a spring from `motion` during resolve
   instead of pure opacity. Try opacity first; it will probably be enough.

### Acceptance (M7 gate)

- Covers show halftone at rest, resolve on hover/focus/in-view (touch).
- Kill WebGL (`about:config` / DevTools) → plain photos, no layout shift,
  no console errors.
- `prefers-reduced-motion: reduce` → plain photos, no shader mounts.
- Keyboard: tabbing to a card resolves it (focus-visible parity).
- No LCP regression (hero is still LCP; shaders mount lazily).
- `npm run build`, `npx tsc --noEmit`, `npm run lint` clean; console clean;
  375/768/1440 checked.
- Commit: `M7: wet-ink work plates — halftone covers resolve to photo`.

---

## M8 — Ink-morph case study navigation (View Transitions API)

### Concept

Clicking a work card morphs its cover into the case study hero and its
title into the case study title; browser back reverses it. The site stops
feeling like pages and starts feeling like one printed object.

### Resources (read first — API names shift between versions)

- https://nextjs.org/docs/app/guides/view-transitions — the canonical
  guide; follow its "morphing shared elements" pattern.
- https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition
- Installed: Next 16.2.10, React 19.2.4. **Verify at implementation time**
  whether React exports `ViewTransition` or `unstable_ViewTransition`
  (check `node_modules/react/index.d.ts` / the Next guide) and the exact
  config key (`experimental.viewTransition` vs stabilized). Do not code
  from memory.

### Implementation steps

1. **Enable the flag** in `next.config.ts` per the current docs.
2. **Name shared elements.** Per-slug unique names:
   - Work card cover (`work.tsx`) and case study hero image
     (`app/work/[slug]/page.tsx`): `view-transition-name: cover-<slug>`.
   - Card `<h3>` and case study `<h1>`: `title-<slug>`.
   Use the React `<ViewTransition>` component if the guide prescribes it
   for App Router navigations, otherwise inline `viewTransitionName`
   styles — whichever the guide shows for Next 16.
   Note: only elements present in both old and new views morph; everything
   else gets the root crossfade.
3. **Tune the defaults in `globals.css`:**
   - Root crossfade ~300ms `--ease-out-quart`
     (`::view-transition-old(root)` / `::view-transition-new(root)`).
   - Morphing groups ~450ms.
   - `@media (prefers-reduced-motion: reduce) { ::view-transition-group(*),
     ::view-transition-old(*), ::view-transition-new(*) {
     animation-duration: 0s !important; } }` (or the equivalent the guide
     recommends) → instant navigation.
4. **Interplay with M7:** the halftone canvas is `aria-hidden` decoration —
   exclude it from the morph (name only the `next/image`, not the canvas
   wrapper). A resolved card morphing its photo into the case study hero is
   the desired look; if the unresolved halftone flashes during the morph,
   add `.is-resolved` on click before navigation.
5. **Case study template check:** ensure `app/work/[slug]/page.tsx` hero
   image and title are stable, top-of-page elements so the morph has a
   clear target. Adjust the template layout only if the morph demands it.

### Risk / fallback

Experimental flag. If it breaks builds or navigation in any way, revert the
flag and ship without M8 — the site must never depend on it. (A userland
fallback, `next-view-transitions` by shuding, exists but is a new
dependency — requires explicit user approval per CLAUDE.md; ask before
adding.) Browsers without the API (older Firefox/Safari) get instant
navigation automatically — that is the built-in fallback, no work needed.

### Acceptance (M8 gate)

- Chrome/Edge: card → case study morphs cover + title; back reverses.
- Firefox/Safari (or flag off): instant navigation, zero errors.
- Reduced motion: instant navigation.
- Keyboard navigation (Enter on focused card) morphs identically.
- Build/type/lint/console clean; 375/768/1440.
- Commit: `M8: ink-morph case study navigation via View Transitions`.

---

## M9 — Press-registration headings (CSS only)

### Concept

Section headings ("Selected work", "About", "Let's talk") print as
misregistered ink layers that slide into register as the heading enters
the viewport — a press sheet aligning. Subtle: offsets ≤ 0.06em, resolved
before the heading reaches mid-viewport, end state identical to today.

### Implementation steps

1. **`.register` utility in `globals.css`.** Heading gets
   `data-text="<same text>"`; `::before` and `::after` render
   `content: attr(data-text)` in sky and poppy at ~55% opacity,
   `mix-blend-mode: multiply`, absolutely positioned over the ink text,
   offset `translate: 0.05em 0.03em` / `-0.05em -0.03em`.
2. **Scroll-driven resolve.** `animation-timeline: view()` animates both
   pseudo-offsets (and opacity → 0) as the heading crosses
   `entry 0% → entry 100%` (tune range so it finishes early). Progressive
   enhancement exactly like the ink washes in `paper-artifacts.tsx`:
   wrap in `@supports (animation-timeline: view())`; browsers without it
   get the registered (plain) heading — hide the pseudos entirely outside
   the `@supports` block.
3. **Reduced motion:** pseudos `display: none`. End state = current site.
4. **Accessibility:** pseudo-element text can be voiced by some screen
   readers. Use the alt syntax `content: attr(data-text) / ""` (and test);
   if support is patchy, put the heading text in an `aria-hidden` child
   span and keep the accessible name on the heading itself. Contrast is
   unaffected — the ink layer is always the real, fully opaque text.
5. **Apply to:** "Selected work" (`work.tsx`), "About" and "Let's talk"
   (`page.tsx`), case study `<h1>`s if it reads well there (skip if it
   fights the M8 title morph — the morphing title must not have moving
   pseudos mid-transition; simplest rule: no `.register` on case study
   pages).
6. **Restraint check (DESIGN.md):** fires once per heading per load, never
   re-triggers, fringe never persists. If any viewport shows the poppy
   fringe at the same time as the poppy CTA and it reads as two accents,
   drop the poppy layer to sky-only misregistration.

### Acceptance (M9 gate)

- Chrome: headings register on scroll-in, once, subtle.
- Safari/Firefox without scroll-timeline: plain headings, no fringe.
- Reduced motion: plain headings.
- Screen reader (NVDA or VoiceOver quick pass): each heading announced
  exactly once, plain text.
- Build/type/lint/console clean; 375/768/1440.
- Commit: `M9: press-registration headings`.

---

## Final pass (after M9)

1. Lighthouse mobile on `/` and one case study: ≥ 90 all categories,
   LCP < 2.5s (hero poster must still be the LCP element — verify the
   work-plate shaders don't mount before first paint).
2. Full reduced-motion sweep: hero poster, static washes, plain photos,
   instant navigation, plain headings.
3. ui-ux-pro-max pre-delivery checklist, a11y items only (per CLAUDE.md —
   it must not override DESIGN.md).
4. Update SPEC.md milestones list with M7–M9 as shipped.

## Out of scope

- No cursor followers, tilt cards, scroll-jacking (DESIGN.md bans stand).
- No new npm dependencies without asking (only candidate:
  `next-view-transitions`, and only if the native flag fails).
- No changes to hero shader, scroll transition, or paper artifacts beyond
  what M8 naming requires.
