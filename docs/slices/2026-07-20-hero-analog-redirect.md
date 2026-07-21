# Slice: Hero — analog redirect + kill the pop-in

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` or
> `superpowers:subagent-driven-development`. This slice is self-contained —
> read it fully before touching any file, do not rely on prior conversation
> context. It intentionally does **not** freeze exact final CSS for the
> aesthetic portion (Task 3) — see "Why this slice is shaped differently"
> below. Steps use `- [ ]` checkbox syntax for tracking.

## Source of truth, in order

1. `SPEC.md`, `DESIGN.md` — current site-wide contract (Task 6 of this slice
   rewrites the hero-relevant parts of `DESIGN.md`; until that task lands,
   `DESIGN.md`'s current hero language describes the *old*, rejected look).
2. `BRIEF.md` (repo root) — Santiago's own words on what's wrong. Quoted
   inline below so this doc doesn't require re-reading it.
3. This slice.

## The complaint (verbatim from BRIEF.md)

> I hate the typography and the picture of the hero. it does not represent
> me. i need that fixed to make it look cool, but pinterest vintage 70s
> analogic cool. with some melancholic classy artsy look. this seems like a
> toy story phrame. not to blame, i love toy story. but this is not what i
> want for my portfolio. i want something a movie director or photographer
> would use. specially for the typography

> I'm tired of this behaviour: when you open the website the hero looks one
> way. after a couple of seconds an effect kicks in and makes it look
> vintage. well, this looks awful and buggy. i need to make it simpler

> [What I do NOT want] Lazy behaviour. Default to the most simple solution.
> Limits. Be creative.

> [What I want] a redisign of the hero based on what i told you. dont be
> overly extensive with this, just make it look cool, it is a targeted task.
> everything is built, i need to make it look nice.

## Decision already made (do not re-litigate)

Santiago was asked, explicitly, whether to re-grade the existing poppy-field
photo or source a new hero image. **Answer: re-grade the existing photo.**
"Everything is built" (his words) — this is a targeted art-direction task on
`public/images/hero/poppies.jpg` / `poppies-1920.jpg`, not a new photo shoot.

## Root cause (investigated, not guessed)

Two independent problems, both currently live in the codebase:

**1. The "Toy Story" look is the noir-lettering type system, not the photo.**
`app/components/hero.tsx:38-49` renders the h1 through three stacked spans
(`noir-line-shadow` / `noir-line-outline` / `noir-line-fill`) styled in
`app/globals.css` (search `.noir-line`, `.hero-noir`) using the **Rye**
Google Font — a thick wild-west/wood-cut display face — with a white fill,
heavy black `-webkit-text-stroke` outline, a hard offset drop-shadow layer,
and a brush-grain SVG filter. That construction — bold cartoon fill + thick
ink outline + drop shadow on a rounded display face — is a title-card/logo
treatment, structurally close to a kids'-movie or theme-park logotype. This
is almost certainly what reads as "Toy Story frame" at hero scale. It was
delivered exactly as spec'd by
`docs/superpowers/plans/2026-07-06-hero-noir-lettering.md` — that plan was
executed faithfully and still produced the look Santiago now rejects.
**Conclusion for this slice: don't repeat a frozen-exact-CSS spec for
another subjective aesthetic swing. See "Why this slice is shaped
differently" below.**

**2. The "kicks in after a couple seconds" bug is `hero-shader.tsx`'s mount
gate, and it directly contradicts `DESIGN.md`'s own rule.**
`app/components/hero-shader.tsx` does not mount the WebGL `PaperTexture`
shader on page load. It waits for the *first* of: a pointer move, touch,
scroll, keydown — or a flat **6-second idle timeout** (`WAKE_EVENTS`,
`setTimeout(fire, 6000)`, lines 12-34). Only after that does it start
loading the shader chunk, compiling GL, and — once a frame has actually
painted — cross-fading it in over 500ms (`.hero-shader.is-ready`,
`app/globals.css` around line 246). A visitor who loads the page and just
looks at it (doesn't move the mouse, scroll, or type inside 6s) watches the
poster visibly change under them ~6 seconds in. `DESIGN.md` line 159
already states the intent: *"the shader crossfade... only after its first
frame has painted over the matched poster — the handoff must be
imperceptible."* The gating design (interaction-or-6s-timeout) is what
breaks that promise, not the crossfade mechanism itself.

## Why this slice is shaped differently

The noir-lettering plan (`docs/superpowers/plans/2026-07-06-hero-noir-lettering.md`)
was a fully-frozen, task-by-task, exact-CSS plan. It was executed correctly
and still missed — because the miss was a subjective aesthetic call, not an
implementation bug. Repeating that shape (frozen CSS written by someone who
can't see the render) risks the same outcome. This slice instead:

- Fixes the **objective** bug (the pop-in) first, as its own small
  independently-committable task — no aesthetic judgment involved, ship it
  immediately.
- Gives the **aesthetic** work a concrete creative brief (references,
  constraints, 2-3 concrete technical directions to try) instead of frozen
  final values.
- **Mandates a visual-review checkpoint**: implement a first pass, take
  real screenshots at 375/768/1440px, and get Santiago's explicit go/no-go
  on the direction *before* polishing or touching `DESIGN.md`. Do not skip
  this step or treat it as optional — it is the single change from the
  process that produced the rejected result.

## Goal

Hero headline typography and photo treatment read as **1970s analog
photography — melancholic, classy, art-directed** — the kind of frame a
film director or photographer would put on a title card or monograph cover.
Not a logo lockup, not a saturated commercial poster, not "vintage" as a
filter bolted onto a modern UI. And: the hero looks the same at the instant
of first paint as it does one second, five seconds, or one minute later. No
runtime transformation the visitor can catch happening.

## Non-goals (do not touch)

- Nav, work section, about section, contact, footer.
- The CTA button shape system (`--radius-ticket`, letterpress shadow) —
  unrelated to this complaint.
- Copy (headline text, subtext, button labels).
- Grid/spacing tokens, color tokens outside the hero (`--sky`, `--poppy`,
  `--paper`, `--ink`, `--white` stay as global tokens; the hero's *applied*
  color grade is what changes, not the token definitions other sections
  read).
- `about`'s portrait — that's a separate slice
  (`2026-07-20-about-portrait-fix.md`); don't fold it in here even though
  it's also a "photo looks bad" complaint.

## Constraints (from CLAUDE.md / DESIGN.md, still apply)

- No new npm dependencies unless truly necessary — ask before adding one.
  `next/font/google` for any new typeface (same pattern as
  Archivo/Newsreader/Rye today, zero install cost).
- Real headline text stays in the DOM for a11y/SEO, regardless of how many
  decorative layers wrap it (the existing shadow/outline/fill span pattern
  in `hero.tsx` already does this correctly — keep that mechanism even if
  the styling changes completely).
- `prefers-reduced-motion: reduce` must render the final frame instantly,
  no exceptions.
- Hero image is the LCP element — stays `priority`, stays preloaded, any
  grade must not add a runtime blocking step before first paint.
- `npm run build` + `npx tsc --noEmit` clean before every commit.
- Read `@paper-design/shaders-react`'s actual exports in `node_modules`
  before writing code against it (per CLAUDE.md) — this applies whether
  Task 2 removes or keeps a live shader.

---

## Task 1: Confirm current state

Time may have passed since this doc was written. Before changing anything:

- [ ] Read `app/components/hero.tsx`, `app/components/hero-shader.tsx`, and
      the `.hero-noir` / `.noir-line*` / `.hero-shader` rules in
      `app/globals.css` in full.
- [ ] Confirm the Rye font is still loaded in `app/layout.tsx` and still the
      hero's `--font-noir`.
- [ ] Confirm `hero-shader.tsx` still gates on `WAKE_EVENTS` +
      `setTimeout(fire, 6000)`.
- [ ] If any of the above has already changed (e.g., someone already
      touched the hero since this doc was written), stop and re-derive the
      root-cause section above against the actual current code before
      proceeding — do not blindly execute Tasks 2+ against a stale
      description.

## Task 2: Kill the pop-in (objective fix, ship independently)

This has no aesthetic ambiguity — do this regardless of what Task 3-5
decide about typography/grade.

- [ ] **Default path: remove the live shader from the hero entirely.**
      Delete `HeroShader`'s usage from `hero.tsx` (the `<HeroShader
      image=.../>` line and its import). The static poster
      (`poppies.jpg`) plus the existing always-on `Grain` component becomes
      the permanent hero surface — no gating, no runtime swap, nothing to
      pop in. `hero-shader.tsx` itself can be deleted if nothing else in
      the codebase imports it (`grep -rn "hero-shader\|HeroShader" app/`
      to confirm before deleting the file).
      This is the default because: (a) it directly and permanently
      eliminates the bug at its root — there is no gate left to mistune,
      (b) Santiago's own words rate simplifying/removing the effect above
      keeping it ("Simplify the effect on the hero or remove it because
      that change after a few seconds looks like sht"), (c) it removes a
      WebGL dependency from the hero's critical path entirely.
- [ ] **Fallback path (only if Task 4's visual checkpoint shows the static
      poster reads flat/dead without *some* subtle live quality):** keep
      `PaperTexture` but delete the `WAKE_EVENTS`/6-second-timeout/
      `awake`/`subscribeWake` gating mechanism outright. Mount immediately
      on client hydration (a plain `useEffect` + `requestAnimationFrame`
      poll for `paperShaderMount`, same readiness-detection logic already
      in the file, just without the wake gate in front of it). The
      crossfade must land within roughly one paint cycle of hydration, not
      on a timer a visitor can perceive as "waiting." Re-read the current
      `hero-shader.tsx` readiness-polling logic (lines ~53-80) before
      touching it — reuse it, only delete the gate above it.
- [ ] Verify: `npm run build`, `npx tsc --noEmit` — zero errors.
- [ ] Verify in browser: load the hero fresh (hard reload), watch for 15+
      seconds without moving the mouse or scrolling. Nothing about the
      hero should visibly change during that window.
- [ ] Verify `prefers-reduced-motion: reduce` still renders correctly (no
      dead code paths left referencing the deleted gate).
- [ ] Commit this task alone: `git commit -m "fix: remove hero shader pop-in, static poster is now permanent"`
      (or, if the fallback path was used: `"fix: mount hero shader immediately, remove interaction/timeout gate"`).

## Task 3: First-pass art direction (draft, not final)

**Creative brief** — concrete enough to execute against, loose enough to
not repeat the noir-lettering mistake:

References to aim toward (mood, not literal copying): Robert Frank's *The
Americans*, a Kodachrome-faded film still, a photography-monograph cover,
Wes Anderson-adjacent but restrained rather than candy-colored, a Godard or
Antonioni title card. Common thread: **desaturated, warm-faded, quiet,
photographic** — not saturated, not cartoon-bold, not a logo.

**Typography — kill the noir-lettering system entirely.** Delete the
`Rye` font load, the `.hero-noir`/`.noir-line*` fill+outline+shadow+grain
construction, and the brush-wipe/wave SVG filter machinery in
`app/globals.css`. Replace with a single flat, confidently-set headline —
no outline, no drop-shadow layer, no comic-lettering construction. Try, in
this order, and pick whichever reads best against the re-graded photo:

1. **Reuse Newsreader Italic** (already loaded, already DESIGN.md's
   "vintage note") at hero scale instead of adding a new font at all — the
   cheapest option and worth trying first per CLAUDE.md's "smallest change
   that works."
2. If (1) doesn't carry hero-headline weight/presence, trial ONE new
   `next/font/google` display face suited to editorial/film-title
   typesetting — candidates to evaluate: **Fraunces** (soft-serif with a
   deliberately "wonky" optical-size italic, reads hand-set/period-
   appropriate), **Bodoni Moda** (high-contrast Didone, classic film-credit
   energy), or **Instrument Serif** (quieter editorial serif). Pick one,
   don't install all three "to compare in prod" — trial locally, commit
   the winner.
3. Whichever face wins: plain color (a single warm off-white or warm ink,
   pick from existing `--white`/`--ink` tokens or a new muted variant),
   tight tracking, no stroke, no shadow layer. If any texture is wanted on
   the type at all, it should be the *same* grain the photo carries
   (visual unity), not a separate bespoke filter.

**Photo grade — analog, not a filter effect.** Apply a warm-faded,
lifted-black, slightly-desaturated grade to the existing poppy photo.
Prefer CSS-only and reversible first: `filter` (contrast, saturate, sepia
mix) and/or a `mix-blend-mode` duotone overlay div (same mechanism family
as the existing `.hero-vignette`), layered over the static `<Image>`. Only
escalate to re-exporting new static image assets (a genuine image-editing
pass on `poppies.jpg`/`poppies-1920.jpg`, committed as new files) if CSS
filters provably can't reach the target look — note in the commit if this
escalation happens and why.

- [ ] Delete the Rye font load (`app/layout.tsx`) and the
      `.hero-noir`/`.noir-line*`/brush-wipe CSS block in
      `app/globals.css` — no commented-out corpses (CLAUDE.md).
- [ ] Implement the typography direction chosen above.
- [ ] Implement the photo grade direction chosen above.
- [ ] Verify build/typecheck clean.

## Task 4: STOP — visual review checkpoint

**Do not proceed to Task 5 without this.** This is the step the previous
hero attempt skipped, and skipping it is the most likely reason it missed.

- [ ] Run `npm run dev`. Take screenshots (or have Santiago look live) at
      375px, 768px, and 1440px.
- [ ] Present the result plainly: "here's the new hero, here's what
      changed, does this direction work or should we try something else
      before I polish it?"
- [ ] If rejected: go back to Task 3 and try a different combination from
      the options listed (or a genuinely new direction informed by
      specific feedback) — do not silently keep iterating on the same
      failed direction without surfacing it.
- [ ] If accepted: proceed to Task 5. Note the final chosen typeface/grade
      approach explicitly (for the DESIGN.md rewrite in Task 6).

## Task 5: Polish pass

- [ ] Cross-viewport check at 375/768/1440px: headline never clips its
      container, contrast against the bottom scrim holds ≥4.5:1 for the
      headline and subtext (check both against the new grade, which likely
      shifted background luminance/color from the old version — don't
      assume the old scrim opacity is still sufficient).
- [ ] `prefers-reduced-motion: reduce` — confirm final frame renders
      instantly, matches what's checked in Task 2.
- [ ] Accessibility: inspect the `<h1>`'s accessible name in DevTools —
      must read exactly "Designing interfaces. Engineering the rest." with
      no duplicated text from any decorative layer.
- [ ] Confirm no more than one poppy-accent element is visible in the hero
      viewport (DESIGN.md anti-pattern rule, still applies) — the CTA
      button remains the one poppy element; the photo grade must not
      introduce a second poppy-toned focal point.

## Task 6: Rewrite DESIGN.md (required, not optional)

`DESIGN.md` is source-of-truth #2. If it still describes the rejected
look, the next agentic session that reads it will re-derive that look.
Update, in place:

- [ ] **Concept** (lines 3-8): rewrite away from "vintage editorial meets
      live shader... the one aesthetic risk lives in the hero shader" if
      the shader was removed in Task 2. Describe the actual new direction
      (analog-photographic, warm-faded grade, restrained editorial type)
      in Santiago's terms from BRIEF.md — "melancholic, classy, artsy,
      70s analog," not toy-like.
- [ ] **Typography → Display** (line 31-33): update if a new font replaced
      Rye/the old headline treatment. Remove any stale reference to the
      noir-lettering fill/outline/shadow construction.
- [ ] **Shader rules** section (lines 117-133): if the shader was removed,
      rewrite this section to reflect that the hero no longer runs a live
      shader — don't leave stale instructions describing removed code. If
      the shader was kept (fallback path), update the "Motion should be
      SLOW" and crossfade-timing language to match the corrected
      (non-gated) mount behavior.
- [ ] Add a one-line superseded-notice at the top of
      `docs/superpowers/specs/2026-07-06-hero-noir-lettering-design.md`
      and `docs/superpowers/plans/2026-07-06-hero-noir-lettering.md`
      pointing at this slice — don't delete the history, just mark it
      superseded so a future reader doesn't treat it as current.

## Task 7: Final verification and commit

- [ ] `npm run build` — zero errors, zero type errors.
- [ ] `npx tsc --noEmit` — zero errors.
- [ ] `npm run lint` — zero errors.
- [ ] Full cross-viewport + reduced-motion sweep one more time after the
      DESIGN.md edits (confirm nothing regressed while editing docs).
- [ ] Commit: `git add app/components/hero.tsx app/layout.tsx app/globals.css DESIGN.md docs/superpowers/specs/2026-07-06-hero-noir-lettering-design.md docs/superpowers/plans/2026-07-06-hero-noir-lettering.md`
      (adjust file list to whatever actually changed, e.g. `hero-shader.tsx`
      deletion), commit message style: `feat: hero analog redirect — new type + grade, remove pop-in`.
