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

const API = "https://api.spotify.com/v1";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

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
  if (
    !process.env.SPOTIFY_REFRESH_TOKEN ||
    !process.env.SPOTIFY_CLIENT_ID ||
    !process.env.SPOTIFY_CLIENT_SECRET
  ) {
    return null; // unconfigured: degrade, never fetch or throw
  }
  try {
    return await cachedFetch();
  } catch (err) {
    console.error("spotify snapshot failed", err);
    return null;
  }
}
