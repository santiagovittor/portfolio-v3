# Interview slice 4: The props — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tool results render as mounted plate cards; the interview gets its entry points (nav + contact row); the easter eggs land.

**Architecture:** One `cards.tsx` client module renders the three tool cards from LOCAL data (`case-studies.ts`, `taste.ts`, shared links) keyed by the minimal tool outputs (`{slug}`, `{category}`, `{}`). `transcript.tsx`'s `renderPart` switches on tool part types. The `links` object moves out of `app/page.tsx` into `app/links.ts` so the contact card and homepage share one source.

**Tech Stack:** Existing design system, `next/image`.

## Global Constraints

- Tool cards are print surfaces → `.plate`, square corners, NO pills.
- Poppy budget: cards may not add a second poppy element to the transcript viewport — card links use `.link-draw` (poppy appears on hover only).
- **Ground truth is `node_modules`:** tool UI part type names and their `state` values (`tool-show_project`, `state: "output-available"`, `part.output` — verify in `node_modules/ai`'s UIMessage part types before coding).
- Voice for all card copy: DESIGN.md (sentence case, plain verbs).
- `npm test`, `npx tsc --noEmit`, `npm run build` clean before every commit; console clean in browser.

---

### Task 1: Shared links module

**Files:**
- Create: `app/links.ts`
- Modify: `app/page.tsx` (delete its local `links` const, import instead)

**Interfaces:**
- Produces: `export const links = { github, store, email, whatsapp, linkedin }` (copy the exact current values from `app/page.tsx`, including the TODO comment about the WhatsApp number).

- [ ] **Step 1: Create `app/links.ts`**

```ts
// app/links.ts
// TODO(sv): confirm email and WhatsApp (SPEC.md → Content inventory)
export const links = {
  github: "https://github.com/santiagovittor",
  store: "https://santiagovittor.store",
  email: "mailto:svittordev@gmail.com",
  whatsapp: "https://wa.me/000000000000",
  linkedin: "https://www.linkedin.com/in/santiago-vittor/",
};
```

- [ ] **Step 2: Update `app/page.tsx`** — remove the local `links` const, add `import { links } from "./links";`. No other changes.

- [ ] **Step 3: Verify** — `npm run build` clean; homepage contact links unchanged in the browser.

- [ ] **Step 4: Commit**

```bash
git add app/links.ts app/page.tsx
git commit -m "interview-4: extract shared links module"
```

### Task 2: Tool cards

**Files:**
- Create: `app/interview/cards.tsx`
- Modify: `app/interview/transcript.tsx` (replace `renderPart` body only)

**Interfaces:**
- Consumes: `caseStudies` from `@/app/work/case-studies`, `tastes`, `TasteCategory` from `@/content/bible/taste`, `links` from `@/app/links`; tool outputs `{ slug }`, `{ category }`, `{}` (slice 2).

- [ ] **Step 1: Implement `app/interview/cards.tsx`**

```tsx
// app/interview/cards.tsx
import Image from "next/image";
import Link from "next/link";
import { caseStudies } from "@/app/work/case-studies";
import { tastes, type TasteCategory } from "@/content/bible/taste";
import { links } from "@/app/links";

export function ProjectCard({ slug }: { slug: string }) {
  const cs = caseStudies.find((c) => c.slug === slug);
  if (!cs) return null; // unknown slug: render nothing, never crash
  return (
    <figure className="plate mt-6 max-w-md bg-white/40">
      <Image
        src={cs.cover.src}
        alt={cs.cover.alt}
        sizes="(min-width: 768px) 28rem, 90vw"
        className="aspect-[3/2] w-full object-cover"
      />
      <figcaption className="p-4">
        <p className="flex items-baseline justify-between gap-4">
          <span className="font-medium">{cs.name}</span>
          <span className="font-serif italic text-shadow-ink">{cs.year}</span>
        </p>
        <p className="mt-1 text-sm text-shadow-ink">{cs.summary}</p>
        <p className="mt-3 text-sm">
          <Link href={`/work/${cs.slug}`} className="link-draw font-medium">
            Read case study
          </Link>
        </p>
      </figcaption>
    </figure>
  );
}

export function TasteCard({ category }: { category: TasteCategory }) {
  const t = tastes[category];
  if (!t) return null;
  return (
    <figure className="plate mt-6 max-w-md bg-white/40 p-4">
      <figcaption className="text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink">
        {t.title}
      </figcaption>
      <ul className="mt-3 space-y-2">
        {t.items.map((item) => (
          <li key={item.name} className="flex items-baseline justify-between gap-4">
            <span className="font-medium">{item.name}</span>
            <span className="text-right font-serif text-sm italic text-shadow-ink">
              {item.note}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function ContactCard() {
  const rows = [
    { label: "Email", href: links.email, note: "answered first" },
    { label: "WhatsApp", href: links.whatsapp, note: "fastest for projects" },
    { label: "LinkedIn", href: links.linkedin, note: "roles and referrals" },
    { label: "Services site", href: links.store, note: "for business projects" },
  ];
  return (
    <div className="plate mt-6 max-w-md bg-white/40 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink">
        Reach the real one
      </p>
      <ul className="mt-2">
        {rows.map((r) => (
          <li key={r.label} className="border-t border-shadow-ink/15 first:border-t-0">
            <a
              href={r.href}
              className="flex items-baseline justify-between gap-4 py-2.5"
            >
              <span className="link-draw text-sm font-medium">{r.label}</span>
              <span className="font-serif text-sm italic text-shadow-ink">
                {r.note}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `transcript.tsx`** — replace ONLY the `renderPart`
function body. First verify the exact part type strings and state field in
`node_modules/ai` (UIMessage tool parts), then:

```tsx
import { ContactCard, ProjectCard, TasteCard } from "./cards";
import type { TasteCategory } from "@/content/bible/taste";

function renderPart(part: InterviewMessage["parts"][number]) {
  if (part.type === "tool-show_project" && part.state === "output-available") {
    return <ProjectCard slug={(part.output as { slug: string }).slug} />;
  }
  if (part.type === "tool-show_taste" && part.state === "output-available") {
    return (
      <TasteCard category={(part.output as { category: TasteCategory }).category} />
    );
  }
  if (part.type === "tool-contact_card" && part.state === "output-available") {
    return <ContactCard />;
  }
  return null; // unknown parts and in-flight tool states render nothing
}
```

- [ ] **Step 3: Browser gates (dev server + key)** — record results:
- "Show me the Canvass project" → plate card with cover, year, working
  case-study link (view transition still works from the card link).
- "What's on the record player?" → taste card, model adds ≤ 1 sentence.
- "How do I hire you?" → contact card with working hrefs.
- Cards never exceed the 72ch column; 375px: cards full width, no overflow.
- Console clean; no crash while the tool part is in its streaming states.

- [ ] **Step 4: Static verification** — `npm test`, `npx tsc --noEmit`, `npm run build` clean.

- [ ] **Step 5: Commit**

```bash
git add app/interview/cards.tsx app/interview/transcript.tsx
git commit -m "interview-4: project, taste and contact tool cards"
```

### Task 3: Entry points + console easter egg

**Files:**
- Modify: `app/components/nav.tsx` (add Interview item)
- Modify: `app/page.tsx` (contact index row)
- Modify: `app/interview/page.tsx` (console egg)

- [ ] **Step 1: Nav item** — in `nav.tsx`, add a fourth `<li>` after Contact
inside the pill nav. The href is absolute (works from `/` and `/work/*`):

```tsx
<li>
  <a
    href="/interview"
    className={`block rounded-[var(--radius-ticket)] px-4 py-2 transition-colors duration-200 sm:rounded-full ${hover}`}
  >
    Interview
  </a>
</li>
```

Check 375px: four items + logo + CTA must not wrap or collide — if tight,
reduce item padding to `px-3` below `sm:` only. Do not drop items.

- [ ] **Step 2: Contact row** — in `app/page.tsx`, add to `contactIndex`
(before "Services site"):

```ts
{ label: "Interview", note: "ask the AI stand-in anything", href: "/interview" },
```

- [ ] **Step 3: Console egg** — in `app/interview/page.tsx`, before
`</main>`, matching the existing console-egg idiom in `layout.tsx`:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `console.log("%cQ — Who built this?%c\\nSV — I did. The stand-in answers upstairs; the source is at https://github.com/santiagovittor/portfolio-v3","font:600 13px Archivo,sans-serif;color:#2a2e33","font:13px Archivo,sans-serif;color:#e86a17")`,
  }}
/>
```

- [ ] **Step 4: Browser gates** — nav shows Interview on `/`, `/interview`,
`/work/[slug]` in the right theme (glass on hero, ink on paper); contact
row hover behaves like its siblings; console shows the egg on `/interview`.
375/768/1440 pass.

- [ ] **Step 5: Static verification** — `npm test`, `npx tsc --noEmit`, `npm run build` clean.

- [ ] **Step 6: Commit**

```bash
git add app/components/nav.tsx app/page.tsx app/interview/page.tsx
git commit -m "interview-4: nav and contact entry points, console egg"
```

## Advisor checkpoint (Opus 4.8)

- Ask the three tool-triggering questions live; verify cards render from
  local data (network tab: no extra fetches beyond the chat stream).
- Design review: plates square-cornered, poppy budget respected, cards
  read as mounted print, nav fits at 375px.
- Try to make a tool crash the page: ask for a project that doesn't exist,
  interrupt mid-tool-call (stop the dev server), spam a chip. Nothing may
  throw.
