# Hero Headline: Hand-Painted Noir Door Lettering — Design

> **Superseded** by `docs/slices/2026-07-20-hero-analog-redirect.md`. This
> design was implemented faithfully and still read as a kids'-movie/logo
> lockup at hero scale, not the analog-photography look intended — kept
> here for history only, not current.

Source brief: `.claude/docs/slices/hero-font.md`.

## Scope

Headline only (`hero.tsx` h1, "Designing interfaces." / "Engineering the rest.").
Nav, body copy, buttons, rest of type system stay exactly as DESIGN.md defines
(Archivo, Swiss grid). No change to DESIGN.md's global typography rules — this
is a scoped exception for the hero h1, noted inline in DESIGN.md's Typography
section as a cross-reference to this spec.

## Honesty check on anatomy

hero-font.md specifies bespoke letterform anatomy (exaggerated high-waisted
crossbars on A/E/H, split-serif points on W/D, elongated stylized Y). No free
webfont matches this exactly. We approximate: **Rye** (Google Font, vintage
wood-type/sign-painter slab serif, loaded via `next/font/google` — same
pattern as Archivo/Newsreader) supplies the base glyph shapes; the dimensional
layering and texture described below supply the "hand-painted noir" character
on top. This reads as *in the spirit of* the reference, not a literal replica.
If Rye's weight/anatomy looks too thin or too generic once rendered, the
fallback is **Ultra** (Google Font, heavier Art Deco slab) — decide by eye
during implementation, not before.

## Color (two colors, per direction)

- **Fill:** `--white` (#FAFAF7), inner body of each letter.
- **Outline:** `--ink` (#141210), thick contour — matches the real 1940s
  gilded-glass reference (black outline, no color accent) and keeps `--poppy`
  singular to the CTA button, per DESIGN.md's one-poppy-per-viewport rule.
- **Cast shadow:** `--ink` as well (same family, offset back layer) — depth
  comes from offset/hardness, not a third color.

## Dimensional layering

Three stacked copies of the same glyphs, same font/size/position, built with
CSS only (no JS, no duplicated DOM text — see Accessibility):

1. **Cast shadow** (back): solid `--ink` fill, `transform: translate(6px, 6px)`
   (scales with clamp'd font size), zero blur — hard-edged, "floating on
   glass," per spec section 1.
2. **Contour** (middle): `-webkit-text-stroke` in `--ink`, thick
   (~3–4% of font-size), transparent fill so only the stroke shows, giving the
   frame line.
3. **Core fill** (front): solid `--white` fill, with a subtle interior
   highlight — a very light linear gradient (white → warm cream `#FFF9EE`)
   top-to-bottom via `background-clip: text` — the "extra mile" polish that
   sells gilded glass catching light, not flat print.

All three are generated via CSS (`::before`/`::after` pulling `attr(data-text)`
content, positioned `absolute` inset-0 over the real text node) so there is
exactly one accessible text source (see Accessibility).

## Hand-painted texture (organic imperfection)

Reuse the exact technique already proven in `grain.tsx`: an inline SVG
`feTurbulence` (fractalNoise) filter, this time feeding a `feDisplacementMap`
that warps the fill layer's edges by a few px — enough to break vector
crispness into a slightly organic, hand-brushed waver, not enough to blur
legibility. Applied only to the fill layer (front), not the shadow (keeps the
shadow crisp/graphic per the reference's "hard-edged" cast shadow).

**Extra-mile polish:**
- Tiny per-corner jitter on the contour stroke via the same displacement
  filter at lower intensity, so the outline isn't a perfect vector ring either
  — sells "brush," not "font with a stroke property."
- A near-invisible warm radial gradient wash (poppy at ≤4%) behind the
  headline block only, echoing the "paper artifacts" ink-bleed system already
  used elsewhere on the site, tying the hero into the site's visual language
  without adding a second poppy *element*.

## Entrance animation

CSS `mask-image` wipe, one-time on load, per line (mirrors the existing
`.hero-word` "ink drying" metaphor, now literal):

- Mask edge is turbulence-displaced (same filter family, applied to the mask
  rather than a hard `clip-path` line) so the wipe boundary itself looks like
  a brush pass, not a mechanical slide.
- Line 1 wipes over ~500ms; line 2 starts ~150ms after line 1 begins; total
  under 900ms, `var(--ease-out-quart)` — fits DESIGN.md's "under 900ms, once,
  nothing else animates on load" budget.
- `prefers-reduced-motion: reduce` → skip straight to final revealed frame,
  matching the existing `.hero-word` reduced-motion block exactly.

## Accessibility

- The `<h1>` keeps real text content (`"Designing interfaces."` /
  `"Engineering the rest."`) as its actual DOM text — screen readers read it
  normally, it stays selectable/searchable, SEO unaffected.
- The layered fill/contour/shadow copies are pure decoration: rendered via
  `::before`/`::after` on a wrapper with `aria-hidden="true"`, sourcing their
  content from a `data-text` attribute (kept in sync with the real text at the
  JSX level, not duplicated as separate visible DOM text nodes).
- Contrast: white fill + thick ink outline over the existing bottom scrim
  (already tuned for 4.5:1 white-on-scrim) — outline adds contrast, never
  reduces it.

## Files touched

- `app/components/hero.tsx` — replace `BlurLine`/`.hero-word` usage on the h1
  with the new layered noir-lettering markup (kept as a small local component
  or inline, matching the file's current single-file style — no new file
  unless the JSX gets unwieldy).
- `app/globals.css` — new rules: layered pseudo-element positioning, SVG
  filter defs (inline `data:` URI like `Grain`'s, or a shared `<svg>` def
  mounted once), mask-wipe keyframes + reduced-motion override.
- `app/layout.tsx` — add `Rye` (or `Ultra`) via `next/font/google`, new CSS
  var e.g. `--font-noir`, scoped to the hero h1 only.
- No new npm dependencies. No changes to DESIGN.md's global type tokens —
  this spec is the documented exception for the hero h1 only.

## Out of scope

- Any other headline/section on the site.
- Changing the confirmed copy ("Designing interfaces." / "Engineering the
  rest.").
- Raster/AI-generated image asset (rejected — no `GEMINI_API_KEY` configured;
  native SVG+CSS approach chosen instead, zero external dependency).
