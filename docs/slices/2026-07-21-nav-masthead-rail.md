# Slice C: The nav is page furniture, not a floating pill

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`.
> Self-contained — read fully before touching a file. Depends on nothing;
> the hero slices (A, B) are already landed and this must not disturb them.
> Steps use `- [ ]`.

## The direction in three lines — veto here, before reading the rest

The nav stops being a glass pill floating over the page and becomes the
**masthead rail of a printed magazine**: a struck SV press mark on the left,
a numbered contents rail in the middle (`01 WORK · 02 ABOUT · …`) sitting on
one hairline rule, a rubber-stamped CTA on the right. The section you are
reading is marked the way a photo editor marks a contact sheet — a
**grease-pencil ring drawn around the live entry**. As you leave the hero,
the rail behaves like a running head: it tells you what page of the magazine
you are on.

Nothing here is a new typeface, a new dependency, or a cursor gimmick.

## Source of truth, in order

1. `DESIGN.md` → Typography, Radii, Motion, Scroll transition.
2. `CLAUDE.md` → hard rules: no new deps without asking, semantic HTML,
   visible focus, 4.5:1 contrast, reduced-motion respect.
3. This slice.

## The complaint (verbatim, Santiago, 2026-07-21)

> current navbar is generic, basic and outdated. looks awfully plain. i need
> to take it to the next level. same with the logo. always maintain my artsy
> vintage analogic 70s vibe. be creative with this.

He is right, and the diagnosis is specific: **a centered blurred pill with
four sans links is the default 2020s SaaS nav.** Every element of it —
`backdrop-blur`, `rounded-full`, `bg-white/12`, evenly spaced link row — is
what a template ships. It is also the only surface on the site that borrows
nothing from the print metaphor the rest of the page is built on: the site
has sprocket holes, frame numbers, ghost numerals, registration marks, a
letterpress seal, laid paper — and then a glass pill.

## What the research says, and what of it applies

Two useful findings, one trap.

- **Applies.** Awwwards' 2024–26 navigation collections converge on
  navigation *as part of the experience* rather than a bar bolted on top:
  menus that use the transition itself as the design moment, hover states
  that fill or draw rather than tint, and editorial sites keeping a
  persistent nav to tablet-landscape before collapsing. ([Awwwards — Best
  of Navigation](https://www.awwwards.com/awwwards/collections/the-best-of-navigation/),
  [30 examples of innovative navigation](https://www.awwwards.com/30-examples-of-innovative-navigation-experiences.html))
- **Applies.** Print vocabulary is the whole opportunity: a magazine
  masthead is name + mark + dateline + strapline, and the **running head**
  is the line printed at the top of every page telling you where you are —
  a navigation pattern that predates the web by four centuries.
  ([Fabrik — masthead design](https://fabrikbrands.com/branding-matters/graphic-design/what-is-a-magazine-masthead-magazine-masthead-design/),
  [CreativePro — designing running heads](https://creativepro.com/dot-font-running-heads/))
- **The trap.** Every "70s design" source points at the same shopping list:
  slab serifs, bubble type, ITC Avant Garde, groovy custom letterforms.
  ([Creative Bloq — best typography of the 1970s](https://www.creativebloq.com/design/fonts-typography/the-best-typography-of-the-1970s-as-chosen-by-experts),
  [Envato — 70s logo design](https://design.tutsplus.com/articles/70s-logo-design-groovy-logos-from-the-1970s-and-retro-logo-inspiration--cms-39486))
  **Do not import any of them.** DESIGN.md allows exactly two faces
  (Archivo, Newsreader Italic) and one label style. The 70s in this site is
  *Unimark discipline plus analog residue* — Vignelli's 1970 NYCTA standards
  manual, not a Saturday Night font. The period feel here comes from
  treatment: tight ligatured letterforms drawn as SVG, hairline rules,
  registration offsets, letterspaced caps, ink that misses by a hair. If a
  display face ever seems genuinely necessary, **stop and ask Santiago** —
  do not add one silently.

## Dependencies

- [ ] **None.** `gsap` + `@gsap/react` are already installed (hero slices)
      and cover every animation here. No new packages, no icon library, no
      SVG toolchain — the press mark is hand-authored path data in a
      component.

## The landmines — read before writing any markup

1. **`nav.tsx` is used on three page types, in two themes.** `page.tsx`
   (`variant="hero"`), `app/interview/page.tsx` and `app/work/[slug]/page.tsx`
   (both `variant="paper"`). Every change has to hold on paper as well as
   over the hero photograph. Check all three before calling it done.
2. **The theme flip is content-aware and must survive.** `nav.tsx:24-63`
   runs an IntersectionObserver over every `[data-nav-theme="dark"]` element
   (the hero card *and* dark work tiles), flipping glass/ink by how many
   intersect the nav's own height band. Do not replace it with a
   scroll-position listener — that is a downgrade, and it would break on the
   work tiles which are mid-page. The running head in Task 4 needs a
   **second, separate** observer over `section[id]`: different targets,
   different rootMargin, different meaning. Do not overload the first one.
3. **Lenis is now live** (site-wide smooth scroll, on the GSAP ticker). It
   animates real `scrollTop`, so IntersectionObserver keeps firing normally
   — but verify it, don't assume it, and verify the observer doesn't thrash
   during a smooth-scrolled anchor jump.
4. **The hero card tilts under the nav now.** `.hero-tilt` leans up to 2°
   toward the cursor and carries its own inset hairline at `z-index: 30`.
   The nav is `fixed`, `z-40`, padded by `--hero-inset + 12px`
   (`.nav-frame`). A rail with its own baseline hairline will sit a few
   pixels above the card's top hairline — two parallel hairlines that close
   to each other read as a printing error. Either land the rail's rule
   clearly inside the card or drop the rule while the hero is on screen.
   Check it *while the card is tilted*, not only at rest.
5. **`overflow: hidden` anywhere on the rail kills the grease-pencil ring.**
   The ring is an absolutely positioned SVG that deliberately overshoots its
   entry's box (a hand-drawn circle never lands on the bounding box). Any
   ancestor clip removes exactly the part that makes it look hand-drawn.
6. **The seal already owns rotation.** `CircularText` renders as a slowly
   spinning letterpress seal on the About portrait (`page.tsx:69`). The new
   SV mark must not be a second rotating circular thing — it would read as a
   duplicate, not a system. The mark is **struck, not spun**.
7. **DESIGN.md says nav is a pill** ("interactive elements (nav, buttons,
   tags) are full pills (999px)", Grid & spacing → Radii). This slice
   deliberately breaks that. It is not allowed to break it silently — see
   Task 7.

## Tasks

### Task 1 — The SV press mark

The logo is currently the two letters `SV` in Archivo medium. That is not a
logo, it is text.

- [ ] New component `app/components/press-mark.tsx` — inline SVG, no
      dependency, `currentColor` so it inherits the nav's theme flip.
- [ ] The mark is a **ligatured SV**: the S's terminal and the V's left
      diagonal share a stem, counters tight, the whole thing sitting on a
      single optical baseline — the Lubalin/U&lc idiom, drawn once as path
      data rather than typed. Set it inside a `--radius-ticket` die-cut
      rectangle with a 1px hairline, so it reads as a stamped press mark
      rather than initials.
- [ ] **Struck, not spun.** On hover/focus-visible the mark performs a
      registration hit: sky and poppy ghosts offset by ~0.05em snap back
      into alignment over 180ms. The mechanic already exists — reuse the
      `.register` / `@keyframes register-align` idiom at
      `globals.css:618-655` rather than writing a second one. Under
      `prefers-reduced-motion: reduce`, no ghosts at all.
- [ ] `aria-label="Santiago Vittor, home"` on the link; the SVG is
      `aria-hidden` with no title. One accessible name, not two.
- [ ] At `lg:` and wider only, the mark is followed by the full name
      letterspaced in label caps (`SANTIAGO VITTOR`) — a masthead is a mark
      *plus* a name. It disappears below `lg` where the rail needs the room.

### Task 2 — The contents rail replaces the pill

- [ ] Delete the glass pill: no `rounded-full`, no `backdrop-blur`, no
      `bg-white/12` container on desktop. What remains is a row of entries
      on **one hairline rule**, the way a contents page rules its columns.
- [ ] Each entry is `NN` + label: the section number in Archivo tabular
      (machine data, per DESIGN.md's two-voices rule) at label size, then
      the label in `.tape-label` caps. Number and label separated by a thin
      space, entries separated by vertical hairlines — not by whitespace
      alone.
- [ ] **Read the numbers off the sections, do not invent them.** The page
      already prints ghost numerals per section (About is `02`,
      `page.tsx:57`). The rail's numbers must match those exactly, including
      whatever Interview is. If a section has no numeral yet, that is
      `SV:confirm` — leave the entry unnumbered rather than guessing.
- [ ] Hover/`:focus-visible`: the label's own hairline warms to poppy and
      draws left-to-right. Reuse `.link-draw` (`globals.css:137-164`) — the
      site has one underline idiom and this must not become the second.
- [ ] Contrast: the rail loses its glass fill, so the type sits directly on
      the photograph over the hero. Measure 4.5:1 **on the graded image**,
      not on the raw poster, and add the minimum text-shadow or local scrim
      that gets there. Over paper it is plain ink and needs nothing.

### Task 3 — The grease-pencil ring (the signature move)

This is the thing a visitor screenshots.

- [ ] The live section's entry is circled by a **chinagraph ring**: one SVG
      ellipse-ish path with a deliberately imperfect, slightly overshooting
      stroke — a `stroke-linecap: round`, ~2px, poppy at ~85% opacity, with
      the ends crossing past each other the way a wax pencil does on a
      contact sheet.
- [ ] It **draws on** rather than fading in: `stroke-dasharray` /
      `stroke-dashoffset` from full length to 0 over 420ms
      `var(--ease-out-quart)`. When the live section changes, the old ring
      draws *off* in reverse before the new one draws on — never two rings
      on screen at once.
- [ ] The ring is `aria-hidden` and purely decorative; the accessible signal
      for the current section is `aria-current="true"` on the entry's link.
      Both, not either.
- [ ] `prefers-reduced-motion: reduce`: the ring appears instantly at full
      length. It is information, so it must not disappear under reduce — only
      its drawing does.
- [ ] Absolutely positioned, `pointer-events: none`, allowed to overshoot
      its entry's box. See landmine 5.

### Task 4 — The running head

- [ ] A **second** IntersectionObserver, separate from the theme observer,
      over `main section[id]`, tracking which section owns the top band of
      the viewport. It sets the entry that gets `aria-current` + the ring.
- [ ] Over the hero (no section yet live) the rail shows all entries evenly.
      Once a section takes over, the *other* entries drop to ~55% opacity —
      the live one is the running head, the rest are the contents list it
      came from. One 200ms opacity transition, nothing else moves.
- [ ] On `variant="paper"` pages (`/interview`, `/work/[slug]`) there is no
      section list to run through: the rail instead prints the page's own
      running head — the case study or page title in `.tape-caption`
      (Newsreader italic, the site's annotation voice) after the mark. Pass
      it as a prop; do not scrape the DOM for an `<h1>`.

### Task 5 — The CTA becomes a stamp

- [ ] "Get in touch" stops being a third glass pill. It becomes a **rubber
      stamp**: `--radius-ticket`, a 1px double rule (outer hairline + inner
      offset hairline), label caps, and a resting rotation of about
      `-1.5deg` — the tell that a human placed it by hand.
- [ ] Hover/`:focus-visible`: it presses. Rotation goes to `0deg`, the fill
      warms to poppy, and the letterpress inset deepens — reuse
      `.btn-letterpress`'s `:active` treatment (`globals.css`, hero slice B)
      rather than inventing a shadow.
- [ ] Static under reduced motion: color change only, resting rotation kept
      (it is composition, not motion).
- [ ] Do not exceed one poppy element per viewport (DESIGN.md → Color). The
      stamp and the grease-pencil ring are both poppy and both live at the
      top of the screen: **the stamp is poppy only on hover**, resting is
      ink/white hairline. Verify this reading on a real screen.

### Task 6 — Mobile keeps its contents sheet, harmonized

The full-screen paper contents dialog (`nav.tsx:132-174`) is the one part of
the current nav that is not generic. **Do not rebuild it.**

- [ ] Trigger relabels from `Menu` to `CONTENTS` in label caps — it opens a
      contents page, so it should say so.
- [ ] Sheet entries gain the same `NN` numbers as the rail, set in the left
      margin against the existing hairline rules.
- [ ] The live section's entry in the sheet gets the same grease-pencil ring
      and `aria-current`. One idiom, two surfaces.
- [ ] Hit targets ≥ 44px. Keep the existing staggered rise and its
      reduced-motion guard exactly as they are.

### Task 7 — Update DESIGN.md in the same breath

- [ ] The Radii rule currently names the nav as a full pill. That is no
      longer true. Amend it the way the hero CTA exception is written: name
      the deviation, give the reason (a pill is generic chrome; the rail is
      page furniture), and say what still *is* a pill. A doc that
      contradicts the code is worse than either.
- [ ] Add the masthead rail + running head to the Scroll transition section,
      replacing the "transparent glass on hero → ink-on-glass on paper"
      sentence, which this slice makes obsolete.

## Non-goals

- No new typeface, no new dependency, no icon library. See "The trap".
- No mega-menu, no full-screen desktop overlay, no cursor follower.
- No scroll-position listeners. The observers stay.
- No rebuild of the mobile contents sheet, and no change to the hero.
- No hiding the nav on scroll-down. Persistent, always reachable.

## Acceptance criteria

- [ ] `npm run build` passes, `npx tsc --noEmit` clean, `npm run lint` clean.
- [ ] Renders correctly on all three page types: `/`, `/interview`,
      `/work/[slug]` — at 375 / 768 / 1440.
- [ ] The dark/paper theme flip still works, including over the dark work
      tiles mid-page, with Lenis running.
- [ ] Text contrast ≥ 4.5:1 in **both** themes, measured over the graded
      hero image and over paper.
- [ ] Keyboard: tab through mark → every rail entry → CTA → (mobile)
      CONTENTS. Every stop has a visible focus state, and `:focus-visible`
      produces the same visual state as hover.
- [ ] `aria-current` tracks the live section; the ring is `aria-hidden`.
- [ ] `prefers-reduced-motion: reduce`: no registration ghosts, no ring
      draw-on (ring still present), no stamp rotation change, sheet stagger
      already guarded.
- [ ] No double hairline where the rail meets the hero card's top edge,
      checked with the card tilted.
- [ ] One poppy element in the viewport at rest.
- [ ] `package.json` unchanged.
- [ ] DESIGN.md no longer contradicts the code (Task 7).

## Commit

Three commits, so the ring can revert alone if it reads as too much:

1. `feat: nav masthead rail + SV press mark, drop the glass pill`
2. `feat: grease-pencil section ring and running head`
3. `feat: contents sheet numbering + DESIGN.md nav rule update`
