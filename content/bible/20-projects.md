---
source: case studies
tags: projects, work
---

## santiagovittor.com — services site with an AI assistant

Bilingual services site where the corner chat IS the product demo — a
client asking "can you build a chatbot?" gets the answer by talking to
one. One streaming endpoint routes three tools: book a call through an
inline Cal.com embed, send a contact request through Resend, or hand off
to WhatsApp. Injection patterns are matched before the model ever sees a
message, and a sliding ten-turn window is trimmed so it never orphans a
tool call. Copy leads with outcomes, tech stack only in the footnotes.
English at the root, Argentine Spanish at /ar. The site opens
conversations instead of collecting form submissions.

## dubanronald.com — paid media agency site

Site for a paid media agency, built to argue its case before it sells.
Opens with "Your budget isn't the problem." — the objection behind every
first meeting — instead of the credentials nobody asked for. Editorial
warmth over agency gloss: Cormorant Garamond over Inter, a warm analog
palette instead of SaaS blue-on-white, a hand-rolled mesh gradient hero.
The Meta Pixel is doubled by the Conversions API, wired server-side, so
conversion events survive iOS ad-blocking — the site practices the
measurement discipline the agency sells. Bilingual (EN/ES) plus a
dedicated real-estate vertical page.

## Canvass — prospecting tool

Prospecting tool I built to run my own client acquisition: maps local
businesses off Google Maps, scores each lead 0-to-1 from pure
deterministic math with Bayesian shrinkage pulling small-sample five-star
ratings toward the mean, then a gated vision pass renders the site in
headless Chromium and has Gemini read the design and name concrete gaps —
the expensive layer only runs for leads heading into outreach. Reply
detection distrusts machines: RFC 3834 headers, out-of-office heuristics,
and reply velocity separate autoresponders from real replies. Five
thousand-plus leads scraped so far, with a cost ledger per send and reply.

## This site — portfolio v3

The site you're on. A 1970s magazine that happens to be alive: shader-
driven hero (paper-shaders), film grain overlay, Swiss 12-column grid,
Archivo + Newsreader italic, press-registration headings, view-transition
ink morphs — and this interview, a RAG chatbot that shows its retrieval
sources as magazine footnotes. Next.js 16, Tailwind v4, no UI kits.
Source: github.com/santiagovittor/portfolio-v3.
