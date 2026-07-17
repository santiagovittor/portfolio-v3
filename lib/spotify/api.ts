// lib/spotify/api.ts — Santiago's live Spotify listening, server-side only.
// One refresh token (env) mints short-lived access tokens on demand; the
// snapshot is cached 120s. Missing env => getSnapshot returns null (the
// interview page degrades to the static taste card, never crashes).
import { unstable_cache } from "next/cache";
import { z } from "zod";

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: string[];
  album: string;
  artUrl: string | null; // largest album image
  url: string; // open.spotify.com/track/{id}
};

export type SpotifySnapshot = {
  nowPlaying: SpotifyTrack | null; // null = nothing spinning right now
  recent: SpotifyTrack[]; // deduped by id, most recent first
  top: SpotifyTrack[]; // medium_term rotation
  fetchedAt: string; // ISO
};

export type SpotifyPick = {
  pick: SpotifyTrack;
  source: string; // human label: "from your liked songs" / 'from the playlist "X"'
};

const API = "https://api.spotify.com/v1";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

function hasSpotifyEnv(): boolean {
  return !!(
    process.env.SPOTIFY_REFRESH_TOKEN &&
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET
  );
}

const imageSchema = z.object({
  url: z.string(),
  width: z.number().nullable().optional(),
});
const trackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(z.object({ name: z.string() })),
  album: z.object({ name: z.string(), images: z.array(imageSchema) }),
  external_urls: z.object({ spotify: z.string() }).optional(),
});

function toTrack(raw: unknown): SpotifyTrack | null {
  const p = trackSchema.safeParse(raw);
  if (!p.success) return null;
  const t = p.data;
  const artUrl =
    [...t.album.images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? null;
  return {
    id: t.id,
    name: t.name,
    artists: t.artists.map((a) => a.name),
    album: t.album.name,
    artUrl,
    url: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
  };
}

let tokenMemo: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (tokenMemo && tokenMemo.expiresAt > Date.now()) return tokenMemo.token;
  const id = process.env.SPOTIFY_CLIENT_ID ?? "";
  const secret = process.env.SPOTIFY_CLIENT_SECRET ?? "";
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN ?? "";
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
  });
  if (!res.ok) throw new Error(`spotify token ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenMemo = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return tokenMemo.token;
}

async function spotifyGet(path: string, token: string): Promise<unknown> {
  const res = await fetch(API + path, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 204) return null; // nothing playing
  if (!res.ok) throw new Error(`spotify ${path} ${res.status}`);
  return res.json();
}

// Uncached, testable. Tolerates per-endpoint failure: a dead endpoint yields
// an empty slot, the rest of the snapshot still ships.
export async function fetchSnapshot(): Promise<SpotifySnapshot> {
  const token = await getAccessToken();
  const [np, rec, top] = await Promise.allSettled([
    spotifyGet("/me/player/currently-playing", token),
    spotifyGet("/me/player/recently-played?limit=5", token),
    spotifyGet("/me/top/tracks?time_range=medium_term&limit=5", token),
  ]);

  const nowPlaying =
    np.status === "fulfilled" && np.value
      ? toTrack((np.value as { item?: unknown }).item)
      : null;

  const recentRaw =
    rec.status === "fulfilled" ? ((rec.value as { items?: unknown[] })?.items ?? []) : [];
  const seen = new Set<string>();
  const recent: SpotifyTrack[] = [];
  for (const i of recentRaw) {
    const t = toTrack((i as { track?: unknown })?.track);
    if (t && !seen.has(t.id)) {
      seen.add(t.id);
      recent.push(t);
    }
  }

  const topRaw =
    top.status === "fulfilled" ? ((top.value as { items?: unknown[] })?.items ?? []) : [];
  const topTracks = topRaw.map(toTrack).filter((t): t is SpotifyTrack => t !== null);

  return { nowPlaying, recent, top: topTracks, fetchedAt: new Date().toISOString() };
}

const cachedFetch = unstable_cache(fetchSnapshot, ["spotify-snapshot"], { revalidate: 120 });

export async function getSnapshot(): Promise<SpotifySnapshot | null> {
  if (!hasSpotifyEnv()) return null; // unconfigured: degrade, never fetch or throw
  try {
    return await cachedFetch();
  } catch (err) {
    console.error("spotify snapshot failed", err);
    return null;
  }
}

// A source we can draw a random track from: all liked songs, or one of
// Santiago's own playlists with enough tracks to be worth recommending from.
export type Source =
  | { kind: "liked"; total: number }
  | { kind: "playlist"; id: string; name: string; total: number };

// Walk a weighted list: source i is chosen with probability total_i / sum, so
// the final pick is uniform across every individual track in the pool.
export function pickSource(pool: Source[], r: number): Source {
  for (const s of pool) {
    if (r < s.total) return s;
    r -= s.total;
  }
  return pool[pool.length - 1];
}

// The exact playlists Santiago wants "recommend a song" to draw from. Matched
// by name, ignoring case, spacing, emoji and punctuation, so edit this list in
// plain words to change the pool. (The "Tu top de canciones 20XX" ones are not
// in his library via the API yet; save them in Spotify and add them here.)
const PLAYLIST_ALLOWLIST = [
  "Vintage Mood",
  "Cool Vibes",
  "Pure beauty",
  "Build me up 2022",
  "Teen pop",
  "IWANTTORIDEMYBICYCLE",
  "2026",
];
const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const allowedPlaylists = new Set(PLAYLIST_ALLOWLIST.map(normName));

// Liked songs + only the allowlisted playlists. Cached an hour: his library
// changes slowly and this is several requests to assemble.
export async function buildSourcePool(): Promise<Source[]> {
  const token = await getAccessToken();
  const pool: Source[] = [];

  const liked = (await spotifyGet("/me/tracks?limit=1", token)) as { total?: number } | null;
  if (liked?.total) pool.push({ kind: "liked", total: liked.total });

  let path: string | null = "/me/playlists?limit=50";
  while (path) {
    const page = (await spotifyGet(path, token)) as {
      items?: Array<{ id: string; name: string; items?: { total?: number } }>;
      next?: string | null;
    } | null;
    for (const p of page?.items ?? []) {
      const count = p.items?.total ?? 0;
      if (count > 0 && allowedPlaylists.has(normName(p.name))) {
        pool.push({ kind: "playlist", id: p.id, name: p.name, total: count });
      }
    }
    path = page?.next ? page.next.replace(API, "") : null;
  }
  return pool;
}

const cachedPool = unstable_cache(buildSourcePool, ["spotify-source-pool"], { revalidate: 3600 });

// One random track from the pool, returned fresh (uncached) each call so
// "recommend a song" varies. Retries a few times because a random slot can
// land on a local file or podcast episode that has no playable track.
export async function getRecommendation(): Promise<SpotifyPick | null> {
  if (!hasSpotifyEnv()) return null;
  try {
    const token = await getAccessToken();
    const pool = await cachedPool();
    const totalTracks = pool.reduce((n, s) => n + s.total, 0);
    if (totalTracks === 0) return null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const src = pickSource(pool, Math.floor(Math.random() * totalTracks));
      const offset = Math.floor(Math.random() * src.total);
      const res = (await spotifyGet(
        src.kind === "liked"
          ? `/me/tracks?offset=${offset}&limit=1`
          : `/playlists/${src.id}/items?offset=${offset}&limit=1`,
        token,
      )) as { items?: Array<{ track?: unknown; item?: unknown }> } | null;
      // /me/tracks nests the track under `track`; /playlists/{id}/items under `item`
      const row = res?.items?.[0];
      const track = toTrack(row?.track ?? row?.item);
      if (track) {
        const source =
          src.kind === "liked" ? "from your liked songs" : `from the playlist "${src.name}"`;
        return { pick: track, source };
      }
    }
    return null;
  } catch (err) {
    console.error("spotify recommendation failed", err);
    return null;
  }
}
