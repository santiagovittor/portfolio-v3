# DESIGN.md — Visual system

Concept: **vintage editorial meets live shader.** A 1970s magazine spread that
happens to be alive — one saturated photographic subject warped by a paper-
shaders effect, oversized grotesque type, film grain over everything, and a
disciplined Swiss grid underneath keeping it from tipping into chaos.
Reference: full-bleed orange poppy on sky blue, sliced/displaced by the shader,
glassy pill nav, headline pinned bottom-left.

The one aesthetic risk lives in the hero shader. Everything after the fold is
quiet, precise, and grid-locked. Spend the boldness once.

## Tokens

### Color (map into Tailwind v4 `@theme`)

| Token          | Hex       | Use |
|----------------|-----------|-----|
| `--sky`        | `#3D8BD9` | Hero field, immersive backgrounds |
| `--poppy`      | `#E86A17` | Accent: primary CTA, links, highlights. Use sparingly |
| `--paper`      | `#EFEAE1` | Page background after the hero (warm newsprint, NOT cream-pink) |
| `--ink`        | `#141210` | Text on paper, card text |
| `--white`      | `#FAFAF7` | Text on hero/sky, glass surfaces |
| `--shadow-ink` | `#2A2E33` | Muted text, borders at 20–30% opacity |

Rules: never more than one poppy element per viewport. No gradients as
decoration — the only gradient-adjacent thing on the site is the shader.

### Typography

- **Display:** Archivo (variable — use width + weight axes). Headlines set
  tight: weight 500–560, tracking -0.02em to -0.04em, line-height 0.95–1.02.
  Hero headline: `clamp(2.75rem, 8vw, 7rem)`.
- **Body:** Archivo 400, 16–18px, line-height 1.55, max measure 65ch.
- **Editorial accent:** Newsreader Italic — used ONLY for image captions,
  pull-quotes in case studies, and the year/role metadata. This is the
  vintage note; keep it rare so it stays special.
- **Mono/labels:** Archivo 500 uppercase, 11–12px, tracking +0.08em, for
  eyebrows, tags, nav items.
- Load all via `next/font/google`, `display: swap`, subsets latin.

### Grid & spacing (Vignelli discipline — this replaces any external grid skill)

- 12-column grid, fluid, max-width 1440px, side margins `clamp(20px, 4vw, 64px)`,
  gutter 24px. Content snaps to columns — no arbitrary widths.
- 8pt baseline: every spacing value is a multiple of 8 (4 allowed below 16px).
  Spacing scale: 8, 16, 24, 32, 48, 64, 96, 128, 192.
- Section rhythm: 128px vertical padding desktop / 64px mobile between sections.
- Alignment is the ornament: hero headline starts at column 1; hero paragraph
  block occupies columns 9–12; work cards span 4 columns each (12 ÷ 3);
  case study text spans columns 4–10. When in doubt, align left, rag right.
- Radii: exactly two shapes site-wide. Print/photographic surfaces (photos,
  covers, plates, and the hero card) are square-cornered with a 1px
  ink/15% hairline (`.plate`), like plates mounted on a magazine page;
  interactive elements (nav, buttons, tags) are full pills (999px) —
  except the hero CTAs, which use `--radius-ticket: 3px` instead, a
  documented, named exception: a full pill at button size reads as
  default rounded UI, the small radius reads as a printed ticket/stamp
  label instead. Nested pills keep a uniform inset (nav container `p-1`)
  so curvature reads concentric.

## The grain (site-wide signature texture)

Fixed full-viewport overlay, above content, `pointer-events: none`:
SVG `feTurbulence` (fractalNoise, baseFrequency ~0.9, numOctaves 2) rendered
to a tiled data-URI or inline SVG, `opacity: 0.05–0.08`,
`mix-blend-mode: overlay`. It must be visible on both sky and paper but never
muddy text. One implementation, one component (`<Grain />`), mounted in the
root layout. If perf suffers, pre-render the noise to a small PNG tile and
repeat it — do not run a live filter per frame.

Optionally add a very subtle vignette on the hero only (radial, 4–6% black at
edges) to sell the vintage-photo look.

## Paper artifacts (the sheet's background system)

The paper after the hero is printed stock, not a flat fill
(`paper-artifacts.tsx`):

- **The grid made visible.** The 12-column layout grid drawn as 1px ink/5%
  hairlines behind everything (4 columns under 768px). Vignelli discipline
  as ornament; it surfaces in open paper, disappears behind content.
- **Ink-bleed washes.** Two or three large radial gradients in the brand
  inks only (sky ≤11%, poppy ≤10%), like offset ink ghosting through the
  stock. They drift ±6rem via scroll-driven animation
  (`animation-timeline: view()`, progressive enhancement, static under
  reduced motion). This is the one sanctioned gradient use besides the
  shader.
- **Second stock.** The about section switches to laid paper (see Section
  backgrounds below) between hairline borders: a textural section break, the
  way a magazine switches paper between signatures. Never more than one
  treated band per page.

## Section backgrounds ("laid paper")

The quiet-premium alternative to a flat `--paper` fill, currently on About;
reusable on Contact if it earns it. Three layers, static and cheap, all
scoped to the section (`overflow: hidden`, ornament at `-z-10` under
`isolate` so it never paints over text):

1. **Ribbing.** Fine horizontal laid lines like Ingres/letterpress stock:
   `repeating-linear-gradient`, 1px ink at 3% opacity every 4px
   (`.laid-paper`). Felt, not seen.
2. **Column rules.** 1px shadow-ink/9% verticals, full section height, only
   on column lines the content actually aligns to (About: content edges plus
   the line where the bio column starts, `100%/12*5`). The layout system
   made visible — the Swiss move, nothing decorative (`.column-rule`).
3. **Ghost numeral.** One oversized Archivo watermark (About: "02"),
   `clamp(9rem, 36vw, 34rem)`, weight 500, ink at 4% opacity, cropped by the
   section edges, positioned in the open lower-right so it avoids body text
   (`.ghost-numeral`). Letterpress: no shadow, no outline.

If a section starts to look busy: drop the numeral first, then thin the
ribbing — the column rules are the keeper. Combined layers must keep body
text ≥ 4.5:1 (worst case here ≈ 13:1, ink on paper + all layers + grain).

## Shader rules (@paper-design/shaders-react)

- **Read the package first.** Inspect its exports and prop types in
  node_modules before writing any code. Do not guess the API.
- One *live* shader per viewport. The hero owns the sky; work plates may
  each mount a `HalftoneCmyk` filter, but they are static renders (speed 0),
  pause offscreen, and degrade to the plain photo. Prefer an effect that can
  distort/displace an image (the reference's sliced-warp look). If the
  library's components are color-field-only in the installed version, layer:
  hero photo (bottom) → shader with transparent/blended regions (top) →
  headline (above). Choose whichever composition gets closest to the
  reference with the least code.
- Motion should be SLOW — barely alive, like heat shimmer. Think 0.1–0.3
  speed factors, not a screensaver.
- Constraints (restate of CLAUDE.md hard rules): static poster fallback,
  reduced-motion serves the poster, pause offscreen, DPR ≤ 2, and the poster
  image is the preloaded LCP element so the shader never blocks paint.

## Scroll transition (hero → work)

The "two views" moment. Implementation: keep it CSS/transform-based, no
scroll-jacking, native scroll always works.

- The hero is `position: sticky; top: 0` in a ~180vh wrapper. As the user
  scrolls, the work section (paper background) slides up over it while the
  hero card (sharp-cornered, inset `clamp(16px, 3vw, 48px)` within a
  `bg-paper` mat, no backdrop layer) scales to ~0.96 and dims slightly
  (scroll-linked via `motion`'s useScroll or CSS scroll-driven animations if
  stable).
- Work cards enter with a small stagger (translateY 24px → 0, opacity,
  120ms apart, 400ms ease-out). Once. No re-triggering on scroll-up.
- Nav: transparent glass on hero (`backdrop-blur`, white/12% fill, 1px
  white/25% border) → on paper it flips to ink-on-glass. One smooth swap.
- Case study navigation morphs via the View Transitions API (M8): the card
  cover and title morph into the case study hero and `<h1>`; reduced motion
  serves instant navigation.

## Motion rules

- Durations 200–500ms, ease-out (`cubic-bezier(0.22, 1, 0.36, 1)`).
  Exceptions: cover-photo creep on work tiles (900ms scale 1.045, rostrum-
  camera slow) and the shader crossfade (500ms, only after its first frame
  has painted over the matched poster — the handoff must be imperceptible).
- Hover: work tiles = cover creep + poppy arrow slides in beside the title;
  links have a resting ink/30 hairline and a poppy underline draws over it;
  contact index rows shift 12px and their hairline warms to poppy.
- Sections rise 24px once on first view (IntersectionObserver + CSS,
  `reveal.tsx`); the ticker strip between hero and work loops at 36s,
  static under reduced motion.
- Page load: headline lines reveal with a 60ms stagger (clip-path or
  translateY), once, under 900ms total. Nothing else animates on load.
- Section headings print with a brief CMYK misregistration that resolves to
  ink as they enter view (M9). End state is always the plain ink heading;
  the fringe never persists.
- If any animation needs a comment to justify it, delete it.

## Voice

Confident, concrete, short. First person singular. No "passionate",
"crafting", "pixel-perfect", "digital experiences". Say what was built and
what happened: "Rebuilt the signup flow. Conversions up 32%." Buttons say
what they do: "See the work", "Get in touch", "Read case study".

## Anti-patterns (hard bans)

- AI-default looks: cream + terracotta serif combo, black + acid green,
  purple/pink AI gradients
- Emoji as icons (use inline SVG / Lucide-style hand-picked SVGs)
- Carousels, tilt-on-hover cards, cursor followers, scroll-jacking
- More than one shader, more than one poppy accent per viewport
- Centered long-form text; measure > 70ch; gray-on-gray text below 4.5:1