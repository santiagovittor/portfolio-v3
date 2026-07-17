# santiagovittor.com

My portfolio. A 1970s print magazine that happens to be alive: a shader-driven
hero, film grain, a Swiss grid, and an interview you can actually talk to.

The homepage is the pitch. This repo is the proof.

## Who I am

I'm Santiago Vittor, a designer-engineer in Buenos Aires. I lead a data and AI
squad at FoodStyles, where I built the internal RAG assistant the team uses
every day and spend most of my time turning messy manual reporting into
automations people actually adopt. Before that, four years in customer success
taught me how people behave when software confuses them. Useful scar tissue for
design work.

I'm looking for product design and frontend engineering roles where AI is a
feature, not the whole pitch.

## The parts worth opening the code for

- **The interview.** Instead of an About page, the site runs a live magazine
  interview with an AI stand-in grounded only in what I wrote about myself. Ask
  it about the work and it answers from a retrieval index and cites its sources
  as magazine footnotes. Prompt-injection is caught before the model sees a
  word, the conversation window is trimmed so it never orphans a tool call, and
  the whole thing falls back to plain text if a key is missing.
- **It plays my music.** Ask what I'm listening to and it pulls my live Spotify
  (now playing, recent, top rotation) into a playable record-sleeve card. Ask
  for a recommendation and it draws a real random track from my liked songs and
  a hand-picked set of my own playlists. The album art morphs into a spinning
  33 1/3 disc while it plays, and nothing loads from Spotify until you press
  play.
- **The look is hand-built.** A WebGL shader hero with a static poster fallback
  and reduced-motion respect, a film-grain overlay, a 12-column grid, and
  view-transition ink morphs between case studies. No UI kit, no component
  library. Every component is hand-rolled.

## Stack

Next.js 16 (App Router), TypeScript strict, Tailwind v4, the Vercel AI SDK,
paper-shaders for WebGL, and motion for animation. Chat runs on an
NVIDIA-hosted Nemotron model, retrieval on Gemini embeddings. Deployed on
Vercel.

No analytics, no cookies, no localStorage. The performance budget is Lighthouse
over 90 on mobile with LCP under 2.5s.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The interview and music features read API keys from
`.env.local` (Gemini, NVIDIA, Spotify); without them the site still builds and
the chat degrades cleanly to static content.

```bash
npm run build      # production build
npm test           # vitest
npx tsc --noEmit   # typecheck
```

## Elsewhere

- Services and business work: [santiagovittor.store](https://santiagovittor.store)
- LinkedIn: [santiago-vittor](https://www.linkedin.com/in/santiago-vittor/)
- Email: svittordev@gmail.com
