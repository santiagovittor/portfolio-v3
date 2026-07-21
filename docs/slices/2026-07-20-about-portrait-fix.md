# Slice: About portrait — swap to pp.jpg, fix crop and resolution

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`.
> Self-contained — read fully before touching files. Small slice, single
> file plus one image swap, but has two real technical gotchas (below) that
> a naive "just change the src" edit will not fix.

## The complaint (verbatim from BRIEF.md)

> Symptoms I can see: current picture of me is awful. it is wrongly
> centered and pixelated

> [What I want] i want the profile picture in the about updated to pp.jpg
> that i added in the public/about folder. make sure it looks good

## Current state (investigated)

`app/page.tsx` (About section, around line 60-68) renders:

```tsx
<figure className="reveal-item relative md:col-span-4">
  <div className="plate overflow-hidden">
    <Image
      src={portrait}
      alt="Santiago Vittor, portrait in a museum gallery"
      sizes="(min-width: 768px) 33vw, 90vw"
      className="aspect-[4/5] object-cover"
    />
  </div>
  <CircularText ... />
  <figcaption className="mt-3 font-serif italic text-shadow-ink">
    Somewhere in Europe, 2025.
  </figcaption>
</figure>
```

`portrait` is imported from `@/public/images/about/portrait-4x5.jpg` at the
top of the file. The image actually being complained about is this one, not
`pp.jpg` — `pp.jpg` already exists at `public/images/about/pp.jpg` but
nothing in the codebase references it yet.

## Two real gotchas — read before editing

**1. `pp.jpg` is 800×800px (confirmed by reading the file directly) — a
tight, square, close-cropped headshot with almost no headroom above the
hair or margin around the shoulders.** The current plate crops to
`aspect-[4/5]` (portrait, taller than wide) via `object-cover` with
*default* `object-position` (50% 50%, dead center of the source). Cropping
a tight square headshot down to a taller-than-wide box with no explicit
`object-position` will, depending on exactly how tight the crop is, either
clip the top of the head or push the eye-line too low/high — this is very
likely the literal cause of "wrongly centered." **Swapping the `src` alone
will not fix this** — `object-position` must be set deliberately and
checked visually, not left at the default.

**2. 800×800px is a real resolution ceiling.** The plate renders at
`md:col-span-4` — at a 1440px-wide viewport that's roughly 440-480px of
display width; `next/image` will request that at up to 2x for high-DPR
screens (~880-960px), which exceeds the 800px source. The image will be
upscaled and look soft/pixelated on any screen wider than roughly
`800px / (col-span-4 fraction) ≈` the point where requested width exceeds
800px — in practice, most laptop/desktop viewports. **This is likely the
literal cause of "pixelated," and swapping to `pp.jpg` without addressing
it will just move the same complaint onto the new image.**

## Goal

`pp.jpg` renders in the About plate, correctly framed (head not clipped,
eye-line reads naturally centered in the 4:5 box), and does not look soft
or pixelated at any viewport up to 1440px+.

## Non-goals

- Don't touch the hero — that's `2026-07-20-hero-analog-redirect.md`, a
  separate slice, even though it's also a "photo looks bad" complaint.
- Don't touch `CircularText`, the plate's border/shadow treatment, or the
  About section's layout/grid.
- Don't invent a new caption fact (see Task 3 below — this is a
  fill-yourself placeholder, not something to guess).

---

## Task 1: Resolve the resolution ceiling

Pick one, in this priority order:

- [ ] **Preferred: ask Santiago for a higher-resolution export of `pp.jpg`**
      (ideally ≥1600×1600, same crop/framing, exported from whatever
      original source produced the 800×800 version) and use that instead.
      This raises the quality ceiling properly rather than working around
      it.
- [ ] **If a higher-res source isn't available or this needs to ship now:**
      cap the plate's effective display size so 800px never gets upscaled
      past a reasonable DPR-2 budget. Concretely: constrain the `sizes`
      attribute and/or the plate's rendered width so the largest requested
      image width stays at or under ~800px (e.g., tighten
      `sizes="(min-width: 768px) 33vw, 90vw"` if it's over-requesting, or
      cap the plate's max-width in the grid). Verify the actual requested
      URL width in DevTools' Network tab at 1440px — confirm it does not
      exceed 800px once this is done.
- [ ] Note in the commit message which path was taken.

## Task 2: Swap the image and fix the crop

- [ ] Change the import at the top of `app/page.tsx` from
      `portrait-4x5.jpg` to `pp.jpg`.
- [ ] Set `object-position` on the `<Image>` deliberately — do not leave
      it at the implicit default. Since `pp.jpg` is a tight square
      headshot, the likely correct value biases toward the top of the
      frame to preserve headroom and keep the eye-line in the classic
      upper-third of the 4:5 box (start from something like `object-top`
      or an explicit `object-position: 50% 20%` and adjust from there —
      pick the exact value by looking at the rendered result, not by
      guessing blind).
- [ ] Verify visually at 375px, 768px, 1440px that: the full head is not
      clipped, there's sensible headroom, the crop doesn't look
      arbitrarily off-center.
- [ ] Confirm `portrait-4x5.jpg` has no other remaining references
      (`grep -rn "portrait-4x5" app/`) — if this was the only usage, the
      old file can stay in `public/` unreferenced (don't delete assets
      without being asked) but the import must be fully switched over,
      no dead import left behind.

## Task 3: Fix the caption and alt text

The current caption ("Somewhere in Europe, 2025.") and alt text
("Santiago Vittor, portrait in a museum gallery") describe the *old*
photo's actual context (a museum gallery, taken in Europe). `pp.jpg` is
visibly a different photo (a plain headshot against greenery) — reusing
that caption/alt verbatim would just be wrong, not a simplification.

- [ ] Replace the alt text with a plain, accurate description of what
      `pp.jpg` actually shows (e.g., a straightforward description of a
      headshot — write what's actually visible, don't invent a location
      or scene that isn't in the photo).
- [ ] For the caption text (location/date/context, if any) — **do not
      invent this.** Leave it as an explicit placeholder for Santiago to
      fill in himself, e.g. `{{SV:confirm — caption for pp.jpg: location/date, or drop the caption entirely if none applies}}`,
      and flag it clearly when handing back. If Santiago has already
      supplied this context by the time this slice is executed, use it
      directly instead of the placeholder.

## Task 4: Verify and commit

- [ ] `npm run build` — zero errors, zero type errors.
- [ ] `npx tsc --noEmit` — zero errors.
- [ ] Browser check at 375px, 768px, 1440px: portrait renders sharp (no
      visible upscale softness/blockiness), correctly framed, caption/alt
      updated.
- [ ] Contrast/legibility of the caption text unaffected (no change to its
      styling, just its content — confirm nothing broke).
- [ ] Commit: `git add app/page.tsx`, message style:
      `fix: swap About portrait to pp.jpg, correct crop and resolution`.
