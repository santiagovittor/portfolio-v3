# SPEC.md — Portfolio v3

## Goal

A portfolio that makes Santiago Vittor read, within 3 seconds, as a designer-
engineer with real taste in July 2026: shader-driven hero, vintage editorial
grain, disciplined grid, fast. The site itself is the proof of skill.

Audience: hiring managers, agencies, and SMB clients (they arrive from
santiagovittor.store, LinkedIn, or cold outreach). Single job of the page:
make them open a case study or hit "Get in touch."

## Pages & structure

```
/                  Home (hero → work → about → contact)  ← 90% of effort
/work/[slug]       Case studies (3 at launch)
/api/*             (none at launch — RAG assistant is post-launch, see Non-goals)
```

### Home, section by section

1. **Hero (viewport-height).**
   - Full-bleed hero image with a paper-shaders distortion effect over it
     (the sliced/warped look — see DESIGN.md → Shader rules).
   - Glassy pill nav top-center: Work, About, Contact. Logo top-left
     ("Santiago Vittor" wordmark or "SV" mark). CTA top-right: "Get in touch".
   - Bottom-left: oversized editorial headline (3 lines max).
     Headline: "Designing interfaces. Engineering the rest." — TODO(sv):
     confirm or replace, keep under 8 words.
   - Bottom-right: one short paragraph (~25 words) + two buttons:
     primary "See the work" (scrolls to §2), secondary "Get in touch".
2. **Work (the scroll reveal).** As the user scrolls past the hero, the page
   transitions into a different "view": a card grid on the paper background
   (see DESIGN.md → Scroll transition). 3–4 project cards. Each card:
   cover image, project name, one-line outcome, stack tags. Click → /work/[slug].
3. **About (compact).** Two-column: portrait or grainy photo left; right, a
   ~60-word bio + capabilities list (Product design, Frontend engineering,
   AI integration, Chatbots & automation) + link out to santiagovittor.store
   labeled "Hiring for a business project? → my services site".
4. **Contact.** Oversized "Let's talk" + mailto link + WhatsApp link +
   GitHub / LinkedIn. No form at launch (no backend = nothing to break).
5. **Footer.** Wordmark, year, "Designed & built by me — view source" link
   to the GitHub repo (the repo IS part of the portfolio).

### Case studies (template, 3 instances)

Structure per case study — problem → decisions → outcome, ~300 words + images:
- Hero: title, one-line summary, role, year, stack
- The problem (2–3 sentences)
- 2–3 key decisions, each with an image or before/after
- Outcome (metrics if real, honest description if not)
- Next/prev case study navigation

Launch content (TODO(sv): verify facts, supply images):
1. **santiagovittor.store** — services site: positioning, conversion copy, WhatsApp funnel
2. **dubanronald.com** — client project
3. **Portfolio AI assistant** — the RAG chatbot from portfolio v2 (write as a case study now; re-integrate live later)

## Content inventory

- Name: Santiago Vittor. Title: pick ONE framing and hold it —
  "Designer-engineer" (recommended) or "Full-stack & AI engineer".
- Location: Buenos Aires, Argentina (worth showing — timezone overlap with US).
- Links: github.com/santiagovittor, santiagovittor.store, LinkedIn TODO(sv),
  email TODO(sv), WhatsApp TODO(sv).
- All copy in English at launch. i18n is a non-goal.

## Non-goals (launch)

- Live RAG assistant (post-launch; design a slot for it in the nav, ship without)
- Blog, CMS, dark-mode toggle, contact form backend, analytics
- Migrating anything from the old portfolio codebase

## Milestones (build in order, verify each per CLAUDE.md)

- **M0 — Scaffold.** Next app, Tailwind v4 tokens from DESIGN.md, fonts
  loaded via next/font, grain overlay component, empty sections with real
  copy. Gate: build passes, tokens render, grain visible.
- **M1 — Hero.** Shader over hero image, glass nav, editorial headline, CTAs.
  Gate: THE VIBE. If the hero doesn't feel like the reference, iterate here
  before moving on. Static fallback verified.
- **M2 — Scroll transition + work cards.** Hero → cards view transition,
  card grid with hover states.
- **M3 — Case studies.** Template + 3 instances with placeholder-honest copy.
- **M4 — About, contact, footer.**
- **M5 — Polish.** SEO metadata, OG image (grainy, on-brand, 1200×630),
  favicon, sitemap, a11y pass, Lighthouse ≥ 90 mobile, reduced-motion pass.

## Acceptance criteria (launch)

- Build clean, console clean, works without JS-heavy features on mobile
- Lighthouse mobile ≥ 90 across the board; LCP < 2.5s
- Keyboard-navigable; reduced-motion serves static hero
- Every image has alt text; one h1 per page; valid OG tags
- Deployed to Vercel, pointed at santiagovittor.online