# Site-Wide Visual Polish — Design

Source brief: `BRIEF.md` (2026-07-08 revision — supersedes the earlier draft's
about-image/contact-grid/radius-audit items, which are dropped from scope).

## Scope

Four listed defects plus an expanded "artistic surface" pass:

1. Hero card border radius reads generic — needs to feel like a physical,
   premium object.
2. Mobile nav collides visually with the hero card's top edge.
3. Nav uses black text that goes unreadable over dark backgrounds it scrolls
   across (currently a single scroll-position threshold, not content-aware).
4. Hero subtext + CTA buttons look like default rounded UI, not vintage/analog.
5. Extended: site-wide "easter eggs, reveals, artistic views" — deliberately
   larger surface area per the user's "go bigger" call, itemized per section
   below so it can be cut at review rather than left open-ended.

Out of scope (dropped from the prior brief draft): About portrait image
swap, "Let's talk" grid empty-space fix, generic `--radius-pill` token/Tailwind
consistency audit (that audit found the pill/plate system already coherent;
only the hero-card singleton was the actual problem, and item 1 below removes
it).

## 1 — Hero: paper-mat print treatment

**Direction (validated against 4 rendered variants — the recommended one won
clearly over three alternatives including a clipped-corner "ticket stub"
treatment, which reads as a contemporary web motif and fights the
nostalgic/film brief):**

The hero card becomes a photograph mounted in a paper mat, like a physical
print — not a rounded UI panel.

- `--radius-hero-card` token is **removed**. Hero card corners go to `0`,
  joining the same sharp-corner language `.plate` already uses for the
  portrait and work-tile covers (see DESIGN.md update below — this deletes
  the "one soft corner singleton" exception rather than adding a new shape).
- **Structural change, not a filter:** the `.hero-backdrop` ambient blurred
  layer is removed. In its place, the hero `<section>` gets a `bg-paper`
  background and padding (`--hero-inset`-driven, same clamp scale as today)
  that reads as the mat/border around the photo. The card sits inside that
  padding at `0` radius — this is a real structural change to `hero.tsx`, not
  a CSS-only skin.
- **Vignette:** a subtle radial darkening (`multiply` blend, ~45% max at the
  corners, transparent through the center 55%) inside the card, over the
  image, under the content layer.
- **Grain boost, hero-scoped only:** the existing `Grain` component
  (`grain.tsx`) is mounted at `opacity: 0.06` site-wide via `mix-blend-mode:
  overlay` — verified too subtle to register as "grainy" at hero scale. Add a
  second `Grain` instance scoped to `.hero-card` at `opacity: ~0.15`,
  layered above the poster/shader, below the text/scrim. Site-wide grain
  opacity is unchanged; this is additive and hero-only.
- **Date-stamp easter egg:** small amber/CRT-style monospace stamp,
  bottom-right corner of the card, reading the *photo's actual EXIF shot
  date* (`'25 11 17`, from the Europa2025 source photos), not today's date —
  reads as an authentic point-and-shoot timestamp rather than a build
  artifact. Low opacity, subtle glow (`text-shadow`), `aria-hidden` (pure
  decoration).

**Build-time verification (cannot be checked from a static screenshot —
flag explicitly because the hero is scroll-pinned):**

`.hero-stage` is a 200svh pinned stage; `.hero-card` currently scales/dims via
the `hero-exit` keyframe on `animation-timeline: scroll(root)`, and
`.work-sheet` slides up over it via `-mt-[100svh]`. Removing `.hero-backdrop`
and wrapping the card in paper padding must be verified against this
choreography at implementation time:
- Confirm no paper "gap" is exposed around the card during the `hero-exit`
  scale-down (previously the backdrop filled that gap; now the section's own
  `bg-paper` must fill it, or the scale-down needs to target a wrapper that
  keeps the padding visually anchored).
- Confirm the `@media (prefers-reduced-motion: reduce)` fallback (`.hero-stage
  { height: auto }`, no pin) still lays out correctly with the new structure.
- Re-run the existing `hero-shader.tsx` mount check against the new DOM
  structure (shader host node position must be unaffected by the padding
  change).

## 2 — Mobile nav seam

**Resolved as a consequence of §1, not a separate patch.** The collision was
two same-radius curves (nav pill ~20px effective radius from its own height,
card's 20px corner) meeting at close range. With the hero card now sharp
(`0` radius) and the mat padding providing a real visual gap before the
image starts, there's no curved edge left to clash against. Verified at
390×844: pill floats cleanly inside the mat with clear separation.

No dedicated "museum tag" component needed (the earlier approved concept,
which matched the pill's corner to the card's 20px, is superseded — the 20px
it matched against no longer exists). Action: just confirm `.nav-frame`
padding (`calc(var(--hero-inset) + 12px)`) still reads as comfortable
breathing room against the new mat-padding value at 375/390/430px during
implementation; adjust the `12px` constant only if it looks tight once real
type/padding is in place.

## 3 — Nav contrast: content-aware, not scroll-position-aware

**Problem statement (the actual bar to clear):** nav text must hold ≥4.5:1
contrast over *every* background at *every* scroll position — the hero, the
paper sections, and specifically the dark regions inside paper sections
(the About portrait, dark work-tile covers) that the current scroll-threshold
toggle doesn't know about and fails over.

**Rejected approach:** `mix-blend-mode: difference` (CSS-only, no JS) —
tempting but goes muddy/low-contrast over mid-tone images, doesn't reliably
hit 4.5:1, rejected on that basis.

**Approach: tag dark zones, observe a nav-height band.**

- Any element the nav can visually pass over that's dark enough to need white
  nav text gets a `data-nav-theme="dark"` attribute: the hero card, the About
  portrait `.plate`, dark work-tile covers.
- Reuse the existing `reveal.tsx` `IntersectionObserver` pattern (already the
  site's established technique for this kind of scroll-driven state, per
  motion rules) with `rootMargin` trimmed so the observer only fires when a
  tagged element intersects the **fixed nav's own height band** at the top of
  the viewport (`rootMargin: "0px 0px -{100% - navHeight}px 0px"`), not "when
  it's anywhere in the viewport." This is what makes it content-aware instead
  of scroll-position-aware — the current `scrollY > innerHeight * 0.9`
  threshold in `nav.tsx` is replaced entirely.
- Nav theme state becomes derived from "how many tagged dark elements
  currently intersect the band" (>0 → dark/white-text mode) rather than a
  single boolean tied to scroll distance.
- `nav.tsx`'s existing `onPaper` boolean and `glass`/`text`/`hover` variant
  logic stay structurally the same — only the signal driving `scrolled`
  changes from a scroll-position check to this observer.

**Pass/fail for this item:** scroll the full page slowly; nav text is legible
(≥4.5:1) at every scroll position, including directly over the portrait and
over dark work-tile covers, not just in the hero and generic paper areas.

## 4 — Hero subtext + buttons: vintage treatment

**Buttons (validated in the corner-treatment mockups):** rectangular, small
radius (~2-3px, not `0` — full sharp corners read too severe at button size),
uppercase, `letter-spacing` ~0.06em, slightly smaller size than body text —
reads as a printed ticket/stamp label rather than a default rounded pill.
Poppy CTA keeps its fill; both buttons get a subtle letterpress inset
(`box-shadow: inset 0 1px 0 rgba(white,0.25), inset 0 -2px 0 rgba(ink,0.25)`
on the poppy button specifically) so they read pressed-into-paper rather than
flat.

**Subtext copy block** ("I design products and build them…") — the part of
item 4 that isn't buttons, called out separately so it doesn't get dropped:
the paragraph itself currently uses plain body type and reads generic next to
the reworked headline/buttons. Treatment: apply the existing `Newsreader`
italic (already reserved in DESIGN.md for "editorial accent / captions /
pull-quotes") to this block, since a short first-person line under a
headline is exactly that role — no new font, uses an existing token per
DESIGN.md's own rule for when Newsreader applies.

## 5 — Expanded artistic surface (itemized for cut-at-review)

Per "go bigger": more sections get a distinct, on-brand artistic detail. Each
item below is independently cuttable — nothing here is load-bearing for
items 1–4. All respect DESIGN.md's existing anti-pattern list (no cursor
followers, no tilt-on-hover, no scroll-jacking, ≤1 poppy accent per
viewport) — "no limits" is read as "no limit on ambition," not license to
reintroduce the exact generic-AI-portfolio patterns DESIGN.md already bans.

- **Work section:** project cards/ticker gain a thin sprocket-hole rail
  (repeating small circles, CSS `repeating-linear-gradient` or
  background-image, no new asset) along one edge of `.ticker-track`,
  reinforcing the filmstrip motif already implied by the grain/paper system.
- **Work cards on hover:** a small negative-strip frame number fades in at
  one corner (e.g. `04A`), mono type, low opacity — echoes contact-sheet
  frame numbering. CSS-only, no JS beyond existing hover state.
- **About section:** the portrait (already `.plate`, sharp+hairline) gets a
  one-time reveal via the existing `Reveal` component (already used
  site-wide for section entrance) rather than a new scroll-jacking effect —
  consistent with the "one clear purpose" pattern already established, not a
  new mechanism.
- **Contact section:** the contact-index list rows adopt the ticket-stub
  clipped-corner motif that lost the hero decision — this is "a good idea in
  the wrong home" per the hero review, and a list of small link rows is the
  right-sized home for it.
- **Footer:** a console easter egg (`console.log` with a short ASCII/monospace
  note) for anyone who opens devtools — zero visual footprint, pure delight,
  no layout risk.

Each of these is small and independently reversible; cut freely at spec
review without touching items 1–4.

## DESIGN.md updates (same pass, so the source of truth doesn't drift)

- Remove `--radius-hero-card: 20px` and its "one soft corner singleton" rule.
- Radius system becomes exactly two shapes: `rounded-full` / 9999px for
  interactive elements (nav, buttons — now including the hero CTAs, which
  move from full-pill to the small-radius "ticket" treatment as a documented,
  named exception alongside the noir-lettering hero-h1 exception already on
  file), and `0` + hairline for photographic/print surfaces (`.plate`, now
  including the hero card).
- Note the Newsreader-italic usage on the hero subtext as within the existing
  documented rule (editorial accent on short first-person copy), not a new
  rule.

## Files touched (expected, confirm exact set at implementation)

- `app/components/hero.tsx` — remove backdrop layer, restructure section
  padding as paper mat, add second `Grain` instance, add date-stamp element,
  Newsreader class on subtext, button class changes.
- `app/globals.css` — remove `--radius-hero-card` + `.hero-backdrop` rules,
  add mat/vignette/date-stamp styles, update `.btn` radius, verify
  `hero-exit`/`.hero-stage` choreography against new structure.
- `app/components/nav.tsx` — replace scroll-threshold `useEffect` with
  IntersectionObserver-based dark-zone detection.
- `app/components/reveal.tsx` — likely reused as-is or lightly extended for
  the nav dark-zone observer (confirm at implementation whether it's reused
  directly or a sibling hook is added).
- Work/About/Contact/footer components — scoped, independent additions per
  §5, cut list finalized at spec review.
- `DESIGN.md` — radius section rewritten per above.

## Out of scope

- About portrait image source swap (prior brief draft item, dropped).
- "Let's talk" grid empty-space treatment (prior brief draft item, dropped).
- Any new npm dependency (all of the above is CSS/SVG/IntersectionObserver,
  consistent with the project's existing hand-rolled-motion approach; `motion`
  package remains unused unless a specific item above proves to need it,
  decided at implementation, not speculatively).
