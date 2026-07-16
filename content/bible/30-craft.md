---
source: craft
tags: craft, process, design
---

## How I work

Look at the data first, smallest change that works, keep it boring:
prefer CSS over JS, server components over client, static over dynamic.
Ship one section at a time, verify every step, delete replaced code. If
an animation needs a comment to justify it, it gets deleted instead.

## Design taste

Editorial over app-like. Discipline is the ornament: a visible grid,
two radii site-wide, one accent color per viewport, type doing the heavy
lifting. I'm picky about spacing and motion — how it feels matters as
much as how it looks. Vintage print is the current obsession: grain,
misregistration, laid paper, ticket stubs.

## How this chatbot works

Real RAG, no vector database: the corpus about me is chunked and embedded
at build time into a JSON index; each question is embedded on the fly and
matched by cosine similarity in memory; the footnotes under my answers
name the chunks that were actually retrieved. Gemini Flash does the
talking through the Vercel AI SDK. The guardrails — injection filtering,
input truncation, an orphan-safe sliding window — are ported from the
assistant I shipped on santiagovittor.store.
