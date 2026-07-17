# Interview slice 9: Spotify B-side (live music data + playable widget) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the interviewer asks about music, the persona answers from
Santiago's *live* Spotify listening (what's playing right now, what he's been
spinning, all-time rotation) instead of only the static bible, and the answer
carries an inline playable card: a record-sleeve widget in the page's editorial
style that plays the track on click (30s preview for anonymous visitors, the
full song if the visitor is logged into Spotify Premium).

**Architecture:** One new server module (`lib/spotify/`) refreshes an OAuth
token from a long-lived refresh token in env and fetches a cached snapshot
(now playing / recently played / top tracks). One new AI-SDK tool
(`now_spinning`) exposes that snapshot to the chat model; its result renders a
new `MusicCard` in the transcript. Playback is the official Spotify iFrame
Embed, click-to-load inside our own styled sleeve: the resting card is 100% our
design (plate, serif italics, small-caps), the Spotify iframe only mounts after
the visitor presses play. Everything degrades to the existing static
`TasteCard("music")` when Spotify is unreachable or unconfigured.

**Tech Stack:** existing only. Zero new npm deps: token refresh and data fetch
are plain `fetch`; the iFrame Embed is a `<script>` from Spotify loaded on
demand. `zod` (installed) validates Spotify responses.

## Investigation record (2026-07-17) — the API landscape this plan is built on

Read this before implementing; it explains every decision below.

1. **Nov 2024 deprecations still stand.** `preview_url`, audio-features,
   audio-analysis, recommendations, related-artists were removed for all apps
   without a pre-2024 quota extension. There is **no `preview_url`** available
   to a new app — any plan that assumes a raw 30s MP3 from Spotify is dead on
   arrival. Scraping the embed page for its internal preview stream violates
   ToS; rejected.
   - https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api
2. **Feb 2026 lockdown.** New apps (created ≥ 2026-02-11): developer account
   **must have Spotify Premium**, one Development Mode client ID per
   developer, max **5 authorized users**, and a reduced endpoint whitelist.
   - https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security
3. **The endpoints this feature needs all survive the whitelist** (checked in
   the February 2026 changelog): `/me/top/tracks` + `/me/top/artists`
   (`user-top-read`), `/me/player/currently-playing`
   (`user-read-currently-playing`), `/me/player/recently-played`
   (`user-read-playback-history`), single `/tracks/{id}`. `/search` survives
   but capped at limit 10 (we don't need it).
   - https://developer.spotify.com/documentation/web-api/references/changes/february-2026
4. **5-user cap is irrelevant here**: only Santiago's own account ever
   authorizes. Extended quota (250k MAU + registered business, per the
   2025-04-15 policy) is out of reach and unnecessary.
5. **Playback for anonymous visitors:** the official iFrame Embed plays a
   ~30s preview for logged-out visitors, then prompts login; full playback for
   logged-in Premium visitors. `allow="encrypted-media"` on the iframe is
   required or it's preview-only even for Premium. This is the only ToS-clean
   route that can ever play the *full* song, which is why it wins over a
   hand-rolled `<audio>` player.
   - https://developer.spotify.com/documentation/embeds/tutorials/troubleshooting
6. **iFrame API** (`https://open.spotify.com/embed/iframe-api/v1`):
   `window.onSpotifyIframeApiReady` → `IFrameAPI.createController(el, {uri,
   width, height}, cb)`; controller has `play/pause/resume/togglePlay/loadUri/
   destroy` and a `playback_update` event (`{isPaused, isBuffering, position,
   duration}`). Browsers block `play()` without a user gesture — our
   click-to-load flow *is* the gesture, so this is fine.
   - https://developer.spotify.com/documentation/embeds/references/iframe-api
7. **Album art without burning quota:** `https://open.spotify.com/oembed?url=<track url>`
   is unauthenticated and returns `thumbnail_url`. We don't need it (the
   authorized API responses already include `album.images`), but it's the
   documented fallback if art is ever missing from a snapshot.
8. **Contingency if Santiago has no Premium** (dev-mode app can't be created):
   fall back to the iTunes Search API (`https://itunes.apple.com/search`,
   unauthenticated, ~20 req/min, `previewUrl` = 30s AAC) matched by
   title+artist from the static bible, played in a fully custom `<audio>`
   sleeve with an Apple Music link (their promo-use terms require the store
   link). Full-song tier is impossible on this path. **Do not build this in
   this slice** — it's the documented plan B only.

## Decisions already made (do not re-litigate)

- **Data source: Spotify Web API with Santiago's own refresh token in env.**
  Classic portfolio "now playing" pattern: one manual authorization-code
  grant, store the refresh token, server mints access tokens on demand.
  No visitor ever authenticates; nothing touches localStorage/cookies on our
  side (CLAUDE.md hard rule).
- **Playback: official Spotify iFrame Embed, click-to-load.** Resting card is
  our design; the Spotify-branded iframe appears only inside the sleeve after
  an explicit visitor click. This also means Spotify's third-party cookies
  load only after that click, keeping the default page storage-clean.
- **New tool `now_spinning`, not prompt injection.** Live data enters via the
  existing tool mechanism (route already streams tool parts; transcript.tsx
  already renders cards for `output-available`). The model narrates from the
  tool result; the card shows the evidence. `show_taste("music")` stays as the
  static fallback and the tool descriptions distinguish them: `now_spinning` =
  "what Santiago is listening to lately, live", `show_taste` = "long-standing
  taste".
- **Snapshot caching: 120s server-side.** The chat route is rate-limited
  5/min/IP already; a 120s cached snapshot keeps Spotify calls per instance
  near zero and far under any rolling rate limit.
- **`next/image` remote pattern for `i.scdn.co` (+ `*.spotifycdn.com`) is an
  approved exception** to the "no external images" rule: that rule exists
  because cross-origin WebGL textures taint the canvas; album art never
  touches the shader pipeline. Add the narrowest `remotePatterns` entries.
- **Env vars:** `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`,
  `SPOTIFY_REFRESH_TOKEN`. Needed for `npm run dev` (music tool only), NOT
  for `npm run build`. Missing vars = tool degrades gracefully, never crashes.
- **Redirect URI for the one-time mint:** `http://127.0.0.1:8888/callback`.
  Spotify's 2025 security rules ban `localhost` and plain-http non-loopback
  URIs; the explicit loopback IP literal is the allowed dev form.

## Prerequisites Santiago does himself (before or during Task 1; agent STOPS if missing)

- [ ] (SV: confirm) **Spotify Premium on the developer account** — mandatory
  for creating a dev-mode app since 2026-02-11. No Premium → stop, report,
  and we decide on the iTunes plan B in a new session.
- [ ] Create the app at https://developer.spotify.com/dashboard (one client
  ID per developer now — reuse an existing one if he has one): name it,
  set redirect URI exactly `http://127.0.0.1:8888/callback`, check "Web API".
- [ ] Put `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` in `.env.local`.
- [ ] Run `npm run spotify:token` (built in Task 1), approve in the browser,
  paste the printed `SPOTIFY_REFRESH_TOKEN` into `.env.local`.
- [ ] Later, at deploy time: add all three vars to the Vercel project env.

## Global Constraints

- `npm test`, `npx tsc --noEmit`, `npm run build` clean before every commit.
- No new npm deps. Read installed types in `node_modules` before using any
  package API; if reality differs from this plan, STOP, adapt minimally, note
  it in the commit body.
- DESIGN.md governs all visuals. No em dashes anywhere (site-feature-wide
  ban; the deDash filter only covers streamed model text, not card copy).
- The interview page must keep working with zero Spotify env vars set — CI
  and `npm run build` have none.
- Sentence case, plain verbs, no filler copy.

---

### Task 1: Token mint script (one-time OAuth, no deps)

**Files:**
- Create: `scripts/spotify-token.ts`
- Modify: `package.json` (add `"spotify:token": "tsx scripts/spotify-token.ts"`)

- [ ] **Step 1:** Write the script with node's `http` + `crypto` only:
  start a server on `127.0.0.1:8888`, print the authorize URL
  (`https://accounts.spotify.com/authorize` with `client_id`,
  `response_type=code`, `redirect_uri=http://127.0.0.1:8888/callback`,
  `scope=user-top-read user-read-currently-playing user-read-playback-history`,
  a random `state`), wait for the callback, verify `state`, exchange the code
  at `https://accounts.spotify.com/api/token` (Basic auth
  `client_id:client_secret`, `grant_type=authorization_code`), print the
  `refresh_token` with a one-line instruction, exit. Reads env from
  `.env.local` the same way `scripts/embed` does (match its pattern).
- [ ] **Step 2:** Verify: run it with dummy credentials — it must print the
  URL and fail cleanly on bad exchange (no stack-trace vomit). Real-token run
  is Santiago's prerequisite step, not the agent's.
- [ ] **Step 3:** Commit — `interview-9: spotify token mint script`.

### Task 2: Spotify data module

**Files:**
- Create: `lib/spotify/api.ts`
- Create: `lib/spotify/api.test.ts`

- [ ] **Step 1: `api.ts`** — small and typed:
  - `getAccessToken()`: POST refresh grant to `accounts.spotify.com/api/token`,
    module-level memo of `{token, expiresAt}` (expiry minus 60s slack).
  - `getSnapshot()`: fetches in parallel `/me/player/currently-playing`,
    `/me/player/recently-played?limit=5`, `/me/top/tracks?time_range=medium_term&limit=5`;
    tolerates 204 (nothing playing) and per-endpoint failure; zod-parses only
    the fields used. Returns:

```ts
export type SpotifyTrack = {
  id: string; name: string; artists: string[]; album: string;
  artUrl: string | null; // largest album image
  url: string;           // open.spotify.com/track/{id}
};
export type SpotifySnapshot = {
  nowPlaying: SpotifyTrack | null;   // null = nothing spinning right now
  recent: SpotifyTrack[];            // deduped by id, most recent first
  top: SpotifyTrack[];               // medium_term rotation
  fetchedAt: string;                 // ISO
};
```

  - Wrap with `unstable_cache` (or the stable equivalent in the installed
    Next — check `node_modules/next` exports first) at `revalidate: 120`,
    keyed `"spotify-snapshot"`. Missing env vars → return `null` immediately
    (no throw, no fetch).
- [ ] **Step 2: tests** — mock `fetch`; cover: happy path shape, 204
  now-playing → `nowPlaying: null`, one endpoint 500 → others still returned,
  missing env → `null`, token memo (second call = one token request).
- [ ] **Step 3: Gates** — `npm test`, `npx tsc --noEmit`, `npm run build`
  (build must pass with no Spotify vars). Commit —
  `interview-9: spotify data module`.

### Task 3: `now_spinning` tool

**Files:**
- Modify: `lib/interview/tools.ts`
- Modify: `lib/interview/prompt.ts` (one line if needed, see Step 2)

- [ ] **Step 1:** Add to `interviewTools`:

```ts
now_spinning: tool({
  description:
    "Live look at what Santiago is listening to on Spotify right now and lately. Use for any question about current music, what he's playing, or listening habits. For long-standing taste use show_taste instead. Follow with at most two sentences that react to the actual tracks.",
  inputSchema: z.object({}),
  execute: async () => {
    const snap = await getSnapshot();
    return snap ?? { unavailable: true as const };
  },
}),
```

- [ ] **Step 2:** Read `lib/interview/prompt.ts`; only if the system prompt
  enumerates tools by name, add `now_spinning` to that list in the same
  style. Do not otherwise grow the prompt.
- [ ] **Step 3:** Manual wire check with real env: `npm run dev`, ask
  "what are you listening to these days?" — route logs a tool call, the
  stream carries a `tool-now_spinning` part with real track names, model
  reacts to the actual data (not bible-only). Then rename the env vars in
  `.env.local` temporarily and confirm the same question yields
  `{ unavailable: true }` and a bible-grounded answer, no crash. Restore.
- [ ] **Step 4:** Gates + commit — `interview-9: now_spinning tool`.

### Task 4: The B-side card (widget UI)

**Files:**
- Create: `app/interview/music-card.tsx` (client component — playback needs it)
- Modify: `app/interview/transcript.tsx` (one render branch)
- Modify: `app/interview/cards.tsx` (nothing removed; MusicCard lives in its
  own file because it's `"use client"` and cards.tsx is server-importable)
- Modify: `next.config.ts` (remotePatterns)
- Modify: `app/globals.css` (keyframes, same section as the interview-7 set)

The card, in the page's language (all tokens from DESIGN.md, structure
mirrors `TasteCard`):

```
┌ plate, max-w-md, bg-white/40 ────────────────────────┐
│ NOW SPINNING              b-side · live from spotify │  ← small-caps eyebrow row,
│                                                      │    pulsing dot (reuse the
│ ┌──────┐  Track name                    ▸ play       │    Recording-dot pattern)
│ │ art  │  artist · album (serif italic, shadow-ink)  │
│ └──────┘                                             │
│ ── recent rotation ────────────────────────────────  │  ← rule + small-caps label
│ Track                         artist  (serif italic) │  ← up to 3 rows, each a
│ Track                         artist                 │    play affordance
│ ──────────────────────────────────────────────────── │
│ open in spotify ↗ (link-draw)      fetched 14:32 ART │  ← footer, text-xs
└──────────────────────────────────────────────────────┘
```

- [ ] **Step 1: resting state.** `MusicCard({ snapshot })` renders the sleeve
  above from the tool result. `nowPlaying: null` → lead row becomes the first
  `recent` track under the label "LAST SPUN" (honest, still alive). Art via
  `next/image` with the new remotePatterns; art `null` → typographic sleeve
  (album initial in serif on `bg-shadow-ink/10`), never a broken image.
  `{ unavailable: true }` → render `<TasteCard category="music" />` instead;
  the widget never shows an error state to the visitor.
- [ ] **Step 2: playback.** Press play on any row →
  1. inject the iFrame API `<script>` once (module-level promise),
  2. swap the lead row's art+title block for a mounted controller
     (`createController(el, { uri: "spotify:track:" + id, height: 80 }, cb)`)
     inside the same frame; the iframe fills the sleeve slot, our chrome stays
     around it. `allow="encrypted-media"` is set by the embed itself — verify
     in devtools, add to the container's iframe if Spotify's script omits it.
  3. subsequent rows call `loadUri` + `play()` on the same controller (one
     iframe per card, ever).
  4. `playback_update` drives the eyebrow dot: pulsing while
     `!isPaused && !isBuffering`, static otherwise. `destroy()` on unmount.
- [ ] **Step 3: motion.** Sleeve enters with the existing card entrance
  (whatever ProjectCard does today — match, don't invent). One new flourish
  max: 33⅓-style slow rotation on the album art *while audio is playing*,
  CSS `animation`, disabled under `prefers-reduced-motion` (the dot falls
  back to a static filled dot there too, matching the Recording-dot
  behavior). Nothing animates in the resting state.
- [ ] **Step 4: transcript wiring.** In `transcript.tsx`, add the branch next
  to the existing three:

```ts
if (part.type === "tool-now_spinning" && part.state === "output-available") {
  return <MusicCard snapshot={part.output} />;
}
```

- [ ] **Step 5: a11y.** Play affordances are `<button>`s with visible focus
  (existing focus tokens), `aria-pressed` for play state, alt text
  `"{album} sleeve"` on art, the live dot is `aria-hidden` with a visually
  hidden "playing" text sibling. 4.5:1 on all text per DESIGN.md.
- [ ] **Step 6: verify in browser** at 375 / 768 / 1440: card fits the
  transcript column, viewport-locked scroll still pins correctly with an
  iframe in the stream, click-to-load means zero Spotify network traffic
  before the first play click (check the Network tab), reduced-motion kills
  the spin and pulse. Console clean.
- [ ] **Step 7:** Gates + commit — `interview-9: b-side music card`.

### Task 5: Press check + docs

**Files:**
- Modify: `docs/superpowers/plans/2026-07-16-interview-README.md`

- [ ] **Step 1: behavior QA, record transcripts:**
  1. "what are you listening to lately?" (EN) → card + grounded reaction.
  2. Same in Spanish → Spanish answer, same card.
  3. "what kind of music do you like?" → should prefer `show_taste`
     (long-standing taste); if the model picks `now_spinning`, that's
     acceptable, note it — but both must never fire for one question with
     two cards stacking ugly; if they stack, tighten the two descriptions.
  4. Spotify env removed → static taste card, no crash, no error card.
  5. Injection attempt mentioning Spotify → refusal path untouched.
- [ ] **Step 2: perf sanity.** Interview page Lighthouse mobile still ≥ 90;
  the iFrame script must not appear in the initial bundle
  (`next build` output + Network tab: it loads on first play click only).
- [ ] **Step 3:** Add row 9 to the README slice table; document the three
  `SPOTIFY_*` env vars in its Environment section (dev + Vercel, not build);
  note rows 7–8 were commit-only UI passes (no plan files) so the numbering
  is explained.
- [ ] **Step 4:** Commit — `interview-9: slice index + env docs`.

## Advisor checkpoint (Opus 4.8) — final gate

- Re-run `npm test`, `npx tsc --noEmit`, `npm run build` with NO Spotify env
  vars. All clean — this is the regression that would break CI/Vercel.
- Demand the Task 3 Step 3 evidence (live tool call AND degraded-path run).
- Demand the Task 4 Step 6 evidence, specifically: zero Spotify requests
  before the first play click, and reduced-motion behavior.
- Read the diff: runtime surface is exactly `lib/spotify/*`, `tools.ts`,
  `music-card.tsx`, one branch in `transcript.tsx`, remotePatterns, css
  keyframes, and (maybe) one prompt line. Reject anything beyond.
- Check the card copy for em dashes and filler. Reject on sight.
- Volatility note for the report: Spotify has cut developer surface three
  times in 20 months (Nov 2024, May 2025, Feb 2026). The graceful-degradation
  path is not optional polish; it is the feature's survival plan. Confirm it
  is airtight before sign-off.
