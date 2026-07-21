# Analytics — what got built and what you have to do

Everything is wired. It stays dark until you paste one key. Steps 1–4 take
about ten minutes; the rest is reference.

---

## What's tracking

**PostHog** (product analytics + session replay) and **Vercel Speed Insights**
(real-user Core Web Vitals). Both are free at your traffic, both run
cookieless.

Cookieless matters twice. CLAUDE.md bans cookies and localStorage on this
site, and most of your traffic is UK/EU, where a cookie-based tracker legally
needs a consent banner. Nothing is written to a visitor's machine, so there is
no banner to design and no law to read. See "Cookieless mode" below for the
one thing it costs you.

### Automatic, no code needed

| Signal | Where it shows up |
|---|---|
| Page views, referrer, UTM, entry/exit page | `$pageview` / `$pageleave` |
| Time on page and scroll depth | properties on `$pageleave` |
| Every click, form submit, input focus | `$autocapture` |
| Rage clicks and dead clicks | `$rageclick`, `$dead_click` |
| Core Web Vitals (LCP, CLS, INP) | `$web_vitals` in PostHog, plus the Vercel Speed Insights tab |
| Country, city, browser, device, OS | properties on every event |
| Session replay (video of the visit) | Replay tab |

### Custom, hand-placed

Named in one file, `lib/analytics/events.ts`, so the dashboard never fills up
with typo'd twins of the same event.

| Event | Fires when | Key properties |
|---|---|---|
| `section_viewed` | a section holds half the viewport for 1s | `section` (`about`, `contact`, `work`…), `path` |
| `outbound_link_clicked` | click on a link leaving the site | `href`, `host`, `label` |
| `interview_started` | first question of a visit | `source` |
| `interview_question_asked` | question sent to the chat | `question`, `question_length`, `source` (`typed`/`suggestion`), `turn` |
| `interview_answer_received` | answer finished streaming | `question`, `latency_ms`, `answer_length`, `sources`, `cards`, `off_the_record` |
| `interview_answer_failed` | the stream errored | `question`, `error`, `latency_ms` |
| `interview_abandoned` | visitor left mid-answer | `question`, `waited_ms` |
| `interview_request_received` | server saw a valid request | `question`, `language`, `off_the_record`, `turn` |
| `interview_retrieval` | RAG finished | `sources`, `chunk_count`, **`no_match`**, `latency_ms` |
| `interview_refused` | a guard blocked it | `reason` (`injection` / `rate_limit`) |
| `interview_upstream_failed` | model/embedding provider fell over | `error` |

Server events carry the browser's PostHog id and session id (sent as
`x-ph-distinct-id` / `x-ph-session-id` headers), so a retrieval miss lands in
the same session as the question that caused it, and you can watch the replay
of it.

---

## 1. Create the PostHog project

1. Sign up at <https://posthog.com/signup>.
2. **Pick the region carefully — you can't move a project later.**
   - **US Cloud** (default): fine, faster from Buenos Aires.
   - **EU Cloud**: pick this if you'd rather your UK/EU visitors' data never
     leaves the EU. If you do, see "Choosing a region" below — two lines
     change.
3. Name the project `santiagovittor.online`.
4. Copy the **Project API key** (starts with `phc_`). It's public and safe to
   ship in the browser bundle — that's what the `NEXT_PUBLIC_` prefix means.

## 2. Add the key locally

`.env.local` already has the placeholders. Fill the first one:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_POSTHOG_UI_HOST=https://us.posthog.com
```

Then:

```
npm run dev
```

Open <http://localhost:3000>, click around, ask the chat something. PostHog
runs in debug mode in development, so the browser console prints every event
it sends. In PostHog, **Activity → Live events** should show them within a few
seconds.

## 3. Add the key to Vercel

Vercel dashboard → your project → **Settings → Environment Variables**. Add
all three from step 2, ticked for **Production, Preview and Development**.
Redeploy (or push a commit) so the build picks them up.

While you're there: **Settings → Speed Insights → Enable**. That's a click, no
key. Web Vitals then show up under the Speed Insights tab.

## 4. Stop counting yourself

Otherwise your own visits pollute every number.

PostHog → **Settings → Project → Filter out internal and test users**. Add:

- `Host` **does not contain** `localhost` (kills all local dev traffic)
- optionally `Person → IP` **is not** your home IP

---

## Reading it — the four things worth checking weekly

1. **Insights → new Funnel:** `$pageview` → `section_viewed` (work) →
   `section_viewed` (contact) → `outbound_link_clicked`. This is "did the
   portfolio do its job".
2. **Insights → new Trend on `interview_retrieval`, breakdown by `no_match`.**
   Every `true` is a question your bible can't answer. This is the single most
   useful number on the site: it tells you exactly what to write next in
   `content/bible/`.
3. **Insights → Trend on `interview_question_asked`, breakdown by `question`.**
   The literal list of what people ask you. Recruiters, mostly.
4. **Replay → filter by event `interview_abandoned`.** Watch the ones who left
   mid-answer. Usually it's latency, sometimes it's a bad first sentence.

A useful fifth: Trend on `interview_answer_received`, value = p95 of
`latency_ms`. If that climbs past ~8s, the model provider is the problem.

---

## Reference

### Cookieless mode

`app/analytics/posthog-provider.tsx` sets `persistence: "memory"`. Identity
lives in a JS variable for the life of the tab and dies with it. Navigation
inside the site keeps one session (it's all client-side routing); a hard
reload starts a new one.

**What it costs:** no cross-visit identity. Someone who visits Monday and
comes back Friday counts as two people. Everything else — sessions, funnels,
replays, geography, referrers, every custom event — works normally.

If you ever decide that's too expensive, change `persistence` to
`"localStorage+cookie"`. But then you need a consent banner for EU/UK traffic,
and you'd be breaking the "No localStorage / cookies" rule in CLAUDE.md — so
change that file too, don't leave it lying.

### Choosing a region

If you picked EU Cloud in step 1, two places change:

1. `.env.local` and Vercel: `https://eu.i.posthog.com` and
   `https://eu.posthog.com`.
2. `next.config.ts` → `rewrites()`: `us-assets.i.posthog.com` →
   `eu-assets.i.posthog.com`, and `us.i.posthog.com` → `eu.i.posthog.com`.

### The /ingest proxy

PostHog is served from your own domain at `/ingest` (the rewrites in
`next.config.ts`). Requests to `posthog.com` are blocked by uBlock, Brave,
Safari and most mobile ad blockers; requests to `santiagovittor.online/ingest`
are not. Expect roughly 20–40% more data than the naive setup. It also means
no third-party host to allow if you add a CSP later.

### Bots

PostHog drops events from known crawlers and headless browsers on its own
(Googlebot, GPTBot, Lighthouse, Playwright, and about eighty others). You
don't have to filter them and they don't show up in your numbers.

### Do Not Track

`respect_dnt: false` — the brief asked for everything registered. Since the
setup is cookieless and stores nothing on the visitor's device, this is a
defensible position, but it is a choice. Flip it to `true` in
`app/analytics/posthog-provider.tsx` if you'd rather honour the header.

### Session replay and typed text

All inputs are masked in replays except `#interview-question`, the chat box —
you chose to log question text, and a replay with the question blanked out is
useless. Nothing else a visitor types is ever recorded.

### Turning it all off

Delete `NEXT_PUBLIC_POSTHOG_KEY`. Every call site checks for it and no-ops.
No errors, no broken pages, no half-state.

### Files

```
lib/analytics/events.ts              event names + header names (the taxonomy)
lib/analytics/client.ts              track() and analyticsHeaders() for the browser
lib/analytics/server.ts              trackServer() + visitorId() for route handlers
app/analytics/posthog-provider.tsx   init, outbound links, section-view observer
app/layout.tsx                       mounts the provider + Speed Insights
app/interview/transcript.tsx         chat events, client side
app/api/interview/route.ts           chat events, server side
next.config.ts                       /ingest reverse proxy
```

### Adding an event later

1. Name it in `lib/analytics/events.ts`.
2. Client: `track(EVENTS.yourEvent, { ...props })`.
   Server: `after(trackServer(EVENTS.yourEvent, who, { ...props }))` — `after`
   keeps the visitor from waiting on it.

Don't call `posthog.capture` directly. `track()` is the thing that no-ops
safely when the key is missing.
