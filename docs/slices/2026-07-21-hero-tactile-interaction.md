# Slice B: Hero — the print responds to hand

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`.
> Self-contained — read fully before touching a file. **Depends on Slice A**
> (`2026-07-21-hero-alive-print.md`) being landed: this slice moves the layers
> A defines. Steps use `- [ ]`.

## Source of truth, in order

1. `DESIGN.md` → Motion rules (200–500ms, `cubic-bezier(0.22, 1, 0.36, 1)`).
2. `CLAUDE.md` → hard rules: reduced-motion respect, visible focus states,
   semantic HTML. The dependency rule is satisfied — Santiago approved GSAP
   and Lenis explicitly on 2026-07-21.
3. This slice.

## Dependencies

Santiago (2026-07-21): *"you are allowed to add new deps, to use lenis gsap
or tilt if you want. no need to reinvent the wheel. i want everything to
look premium and amazing."*

Taken up:

- [ ] **`gsap` + `@gsap/react`** (already installed by Slice A). Used here
      for `gsap.quickTo` — see Task 1. This is the one that genuinely
      changes how the hero *feels*, not just how it's coded.
- [ ] **`lenis`** — site-wide smooth scroll, Task 5. Small, and it is the
      single highest ratio of premium-feel to lines-of-code available.

Declined, with reasons — not dogma, these were re-evaluated after the
restriction lifted:

- **A tilt library** (`react-parallax-tilt`, `vanilla-tilt`). Once GSAP is
  in the bundle, `quickTo` does strictly more (frame-rate-independent
  damping, real inertia) in fewer lines than configuring a tilt lib, and
  without a second animation engine fighting the first for the same
  transform. Adding it would be the *opposite* of not reinventing the wheel.
- **ScrollTrigger** for the hero pin. The existing native
  `animation-timeline: scroll(root)` (globals.css:257-272) already works,
  runs off the main thread, and degrades correctly. Replacing working native
  scroll-driven CSS with a JS scroll listener is a downgrade in both
  performance and robustness. **Reach for ScrollTrigger only if Task 5
  proves Lenis breaks the native timeline** — that is the one condition that
  flips this decision.

## The complaint (verbatim, Santiago, 2026-07-21)

> add animations […] make the buttons beautiful and original. […] i want
> hover animations that make sense, not that just magnetic stupid button
> animation. i want something SPECIAL, that screams that i am a skillful web
> designer. this is 2026, sky is the limit. i want a subtle animation when
> you hover the hero card, some movement, to make the card slightly
> inclinate as if it was real (this is just an idea).

## Direction — physical print, not "3D card component"

The idea Santiago named is right and the reason it's right is the site's own
metaphor: the hero is **a photographic print mounted in a paper mat**
(globals.css:166-173). A print you lean over catches the light differently
and shows a hair of depth against its mat. That is what the interaction
should simulate — not an Aceternity-style toy card that pops off the page.

Ceiling on the whole slice: **if a visitor consciously notices "an
animation," it's too much.** Max tilt 4°, max parallax 10px.

## The landmine — read before writing any transform

`.hero-card` **already has a running transform animation**:

```css
/* globals.css:257-272 */
.hero-pin .hero-card { animation: hero-exit linear both; animation-timeline: scroll(root); }
@keyframes hero-exit { to { transform: scale(0.96); filter: brightness(0.75); } }
```

A CSS animation's `transform` beats an inline/hover `transform` on the same
element. Putting the tilt on `.hero-card` means **the tilt silently dies the
moment the user scrolls a pixel** — and it will look intermittent, not
broken, so it ships bugged. `magnet.tsx` documents this exact class of bug
("Transform lives on this wrapper so it never fights the .btn hover
transform").

**Required structure:** perspective on `.hero-card`; a new inner
`.hero-tilt` wrapper holds `rotate3d`, and the poster/grade/text layers live
inside it. Two elements, two transforms, no collision.

## Tasks

### Task 1 — Tilt the print

- [ ] Add `.hero-tilt` inside `.hero-card` wrapping poster + grade + halation
      + fiber + scrim + content. `.hero-card { perspective: 1200px; }`,
      `.hero-tilt { transform-style: preserve-3d; will-change: transform; }`.
- [ ] New client component. Drive the rotation with **`gsap.quickTo`**, not
      a CSS transition on `pointermove`:

      ```js
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" });
      ```

      This is the reason GSAP is worth its bytes here. A CSS transition
      restarts from the current value on every `pointermove` event, so fast
      cursor movement reads as stepping. `quickTo` keeps one continuous
      frame-rate-independent tween running toward a moving target — the
      card *lags the hand slightly and catches up*, which is exactly how a
      weighted physical object behaves. It is also the cheapest call in
      GSAP's API: no new tween per event.
- [ ] Values are **proportional to cursor distance from center**, `-1..1`
      scaled to 4deg max. Do **not** use `rotate3d(ty, tx, 0, 4deg)` — it
      normalizes its axis vector, discarding magnitude: the angle stays
      pinned at full 4deg and only the axis direction tracks the cursor, so
      one pixel off center snaps to max tilt. `rotationX`/`rotationY` (which
      is what `quickTo` sets above) has no such problem.
- [ ] Sign convention: the card leans *toward* the cursor. Confirm the
      direction against the real render; getting it backwards is subtle
      enough to ship unnoticed and feels wrong without the viewer knowing why.
- [ ] Guards, copied from `magnet.tsx` (which knows them): bail on
      `pointerType !== "mouse"`. For reduced motion use
      `gsap.matchMedia()` so the handler is never wired up under reduce.
- [ ] `pointerleave` → `rx(0); ry(0);`. Same tween, same easing, no separate
      return-to-rest code path.
- [ ] `useGSAP()` for setup + automatic cleanup. No React state, no
      re-render per frame.

### Task 2 — Depth, so the tilt reads as real

A flat image rotating looks like a rotating flat image. Two cheap layers
sell it:

- [ ] **Parallax:** the headline + credit block sit at
      `translateZ(28px)`; the poster stays at `translateZ(0)`. `preserve-3d`
      does the rest for free — the type drifts against the photo when the
      card leans. No per-layer JS.

> **Second landmine — the 3D context breaks silently.** `translateZ` only
> renders as depth if `preserve-3d` is unbroken from the perspective element
> down to the headline. `transform-style: preserve-3d` **computes to flat**
> on any element that also has `overflow` ≠ visible, `filter`, `opacity` < 1,
> `mix-blend-mode`, `clip-path`, or `mask`. This hero is built almost
> entirely out of those:
>
> - the content wrapper between `.hero-tilt` and the headline
>   (`<div class="absolute inset-x-0 bottom-0 flex…">`, hero.tsx:39) defaults
>   to `transform-style: flat` → **translateZ on the headline does nothing**
>   unless that wrapper is `preserve-3d` too. This is the most likely
>   silent failure.
> - `.hero-card` has `overflow: hidden`, and `hero-exit` animates
>   `filter: brightness()` onto it *during scroll*
> - the poster carries the grade `filter`; grade / vignette / halation all
>   use `mix-blend-mode`
> - Slice A's SplitText `mask: "lines"` adds `overflow: hidden` per line —
>   it must sit **below** the `translateZ` element, never above it

- [ ] Requirement, state it in the CSS comment too: perspective on
      `.hero-card`, unbroken `preserve-3d` on `.hero-tilt` **and** the
      content wrapper, and no flattening property on any link in that chain.
- [ ] Verify depth **while scrolling**, not only at rest. The `hero-exit`
      filter landing on the card mid-scroll is exactly the kind of thing
      that collapses the 3D context halfway down — the same failure mode the
      `.hero-tilt` split exists to prevent, one layer up.
- [ ] **Fallback if it flattens** (take it without a fight — it is not a
      downgrade): drive parallax with a second `quickTo` that counter-
      translates the text layer a few px against the tilt, in pure 2D. At
      4° / 10px it is visually indistinguishable from true `translateZ` and
      immune to the entire flattening problem. GSAP already drives the tilt,
      so this costs two lines.
- [ ] **Specular sweep:** one `aria-hidden` layer, a soft white linear
      gradient at low opacity, `mix-blend-mode: soft-light`, its position
      driven by a third `quickTo` on `backgroundPosition` (or on a CSS
      custom property — GSAP tweens registered custom properties directly).
      Reads as glancing light on a glossy print. Off entirely under reduced
      motion and on touch (it never moves there, so a static sheen is just a
      smudge).

### Task 3 — Kill Magnet, design real buttons

- [ ] Delete `app/components/magnet.tsx`, its import + both wrappers in
      `hero.tsx`, and the `.magnet` rule at `globals.css:387-389`. It is used
      **nowhere else** (verified by grep) — remove it, don't orphan it.
- [ ] Primary — **"See the work" as a shutter**: the poppy fill is a
      `background-size: 0 100%` layer that wipes in from the bottom edge on
      hover (260ms, `--ease-out-quart`), the label crossfades ink→paper as it
      passes, and the existing `.btn-letterpress` inset shadow deepens on
      `:active`. It reads as a frame advancing — motivated by the
      contact-sheet motif already in the site (`.frame-number`), not
      decoration invented for the hero.
- [ ] Secondary — **"Get in touch" as a ticket stub**: keep the glass/ghost
      treatment, add a hairline that draws left-to-right on hover reusing the
      `.link-draw` background-size mechanic (globals.css:135-158) so the site
      has *one* underline idiom, not two. Arrow slides in via the existing
      `.tile-arrow` rule.
- [ ] Both: `:focus-visible` must produce the **same** visual state as hover,
      plus the outline. Keyboard users get the design too.
- [ ] Both: static under `prefers-reduced-motion` — color change only, no
      transform, no wipe.

### Task 4 — Verify the collision is actually gone

- [ ] Hover the card, then scroll while still hovering. The scroll-driven
      `hero-exit` scale/dim must run **and** the tilt must survive. If either
      drops, the layer split in Task 1 is wrong — fix the structure, don't
      add `!important`.
- [ ] Touch device (or DevTools device mode): no tilt, no sweep, no jank,
      buttons fully usable and hit targets ≥ 44px.

### Task 5 — Lenis smooth scroll (site-wide, do this last)

Weight in the scroll is what separates a premium site from a competent one,
and it costs ~10 lines. But it touches every page, so it lands after the
hero is right — if it causes trouble, it reverts alone.

- [ ] `npm i lenis`. Init once in the root layout via a small client
      component: `new Lenis()`, drive it from GSAP's ticker
      (`gsap.ticker.add`) rather than a second `requestAnimationFrame` loop —
      one clock for the whole site, no two engines drifting apart.
- [ ] `lenis.destroy()` on unmount.
- [ ] **Blocking verification — the hero pin.** Lenis animates the real
      `scrollTop` rather than transforming a wrapper, so native
      `animation-timeline: scroll(root)` should keep working. *Should.*
      Verify by hand: scroll through the hero with Lenis on and confirm
      `hero-exit` still scales/dims in lockstep, and that the work sheet
      still finishes its cover exactly as the hero unpins. If it desyncs,
      that is the one condition that justifies ScrollTrigger — take it then,
      not preemptively.
- [ ] Anchor links (`#work`, `#contact` — the hero buttons) must still jump
      correctly. Use `lenis.scrollTo` for them or confirm native anchors are
      handled.
- [ ] `prefers-reduced-motion: reduce` → do not initialize Lenis at all.
      Hijacked scroll is a vestibular trigger, and this one is not
      negotiable.
- [ ] Keyboard: PageUp/PageDown/Home/End/space still scroll. Verify — this
      is where smooth-scroll libraries most often quietly break a11y.

## Non-goals

- No magnetic-cursor anything, anywhere, ever again.
- No cursor-follower, no custom cursor, no WebGL. The photo is the hero.
- No ScrollTrigger unless Task 5 proves Lenis broke the native timeline.
- No tilt library. `quickTo` covers it; see Dependencies.

## Acceptance criteria

- [ ] `npm run build` passes, zero type errors. `npx tsc --noEmit` clean.
- [ ] `magnet.tsx` no longer exists; `grep -r magnet app/` returns nothing.
- [ ] Tilt survives concurrent scroll (Task 4 check, done by hand).
- [ ] `prefers-reduced-motion: reduce` → zero hero motion: no tilt, no sweep,
      no button transforms.
- [ ] Keyboard tab through both buttons shows the full hover state + outline.
- [ ] No dropped frames while tilting (DevTools Performance, 1440px).
- [ ] Headline still ≥ 4.5:1 **at max tilt and max parallax** — Slice A
      measured it at rest; `translateZ(28px)` drifts it off that measured
      scrim position (and scales it ~2.4% at `perspective: 1200px`).
- [ ] `prefers-reduced-motion: reduce` → Lenis never initializes; native
      scroll only.
- [ ] Hero pin still in lockstep with Lenis running (Task 5).
- [ ] Keyboard scrolling (PageUp/Down/Home/End/space) and `#work` /
      `#contact` anchors all still work.
- [ ] `package.json` adds exactly `gsap`, `@gsap/react`, `lenis`. Nothing
      else crept in.

## Commit

Two commits, so Lenis can revert alone:

1. `feat: hero tilt + parallax depth, shutter and stub buttons, drop magnet`
2. `feat: lenis smooth scroll on gsap ticker`
