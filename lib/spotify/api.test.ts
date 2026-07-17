import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TOKEN = "accounts.spotify.com/api/token";

type Resp = { ok: boolean; status: number; json: () => Promise<unknown> };
const ok = (body: unknown): Resp => ({ ok: true, status: 200, json: async () => body });
const noContent = (): Resp => ({
  ok: true,
  status: 204,
  json: async () => {
    throw new Error("no body");
  },
});
const fail = (status: number): Resp => ({ ok: false, status, json: async () => ({}) });

function trackJson(id: string) {
  return {
    id,
    name: `Track ${id}`,
    artists: [{ name: "Artist" }],
    album: {
      name: "Album",
      images: [
        { url: `http://img/${id}-small`, width: 64 },
        { url: `http://img/${id}-big`, width: 640 },
      ],
    },
    external_urls: { spotify: `https://open.spotify.com/track/${id}` },
  };
}

function mockFetch(handlers: [string, () => Resp][]) {
  return vi.fn(async (url: unknown) => {
    const u = String(url);
    for (const [match, resp] of handlers) if (u.includes(match)) return resp();
    return fail(404);
  });
}

beforeEach(() => {
  vi.resetModules();
  process.env.SPOTIFY_CLIENT_ID = "id";
  process.env.SPOTIFY_CLIENT_SECRET = "secret";
  process.env.SPOTIFY_REFRESH_TOKEN = "refresh";
});
afterEach(() => vi.restoreAllMocks());

describe("fetchSnapshot", () => {
  it("returns the mapped shape: largest art, deduped recents, top rotation", async () => {
    global.fetch = mockFetch([
      [TOKEN, () => ok({ access_token: "at", expires_in: 3600 })],
      ["currently-playing", () => ok({ item: trackJson("np") })],
      [
        "recently-played",
        () =>
          ok({ items: [{ track: trackJson("r1") }, { track: trackJson("r1") }, { track: trackJson("r2") }] }),
      ],
      ["top/tracks", () => ok({ items: [trackJson("t1"), trackJson("t2")] })],
    ]) as unknown as typeof fetch;

    const { fetchSnapshot } = await import("./api");
    const snap = await fetchSnapshot();

    expect(snap.nowPlaying?.id).toBe("np");
    expect(snap.nowPlaying?.artUrl).toBe("http://img/np-big"); // largest wins
    expect(snap.nowPlaying?.artists).toEqual(["Artist"]);
    expect(snap.recent.map((t) => t.id)).toEqual(["r1", "r2"]); // deduped
    expect(snap.top.map((t) => t.id)).toEqual(["t1", "t2"]);
    expect(snap.fetchedAt).toBeTruthy();
  });

  it("treats a 204 currently-playing as nothing spinning", async () => {
    global.fetch = mockFetch([
      [TOKEN, () => ok({ access_token: "at", expires_in: 3600 })],
      ["currently-playing", () => noContent()],
      ["recently-played", () => ok({ items: [{ track: trackJson("r1") }] })],
      ["top/tracks", () => ok({ items: [] })],
    ]) as unknown as typeof fetch;

    const { fetchSnapshot } = await import("./api");
    const snap = await fetchSnapshot();
    expect(snap.nowPlaying).toBeNull();
    expect(snap.recent.map((t) => t.id)).toEqual(["r1"]);
  });

  it("survives one endpoint failing: others still return", async () => {
    global.fetch = mockFetch([
      [TOKEN, () => ok({ access_token: "at", expires_in: 3600 })],
      ["currently-playing", () => ok({ item: trackJson("np") })],
      ["recently-played", () => fail(500)],
      ["top/tracks", () => ok({ items: [trackJson("t1"), trackJson("t2")] })],
    ]) as unknown as typeof fetch;

    const { fetchSnapshot } = await import("./api");
    const snap = await fetchSnapshot();
    expect(snap.recent).toEqual([]);
    expect(snap.nowPlaying?.id).toBe("np");
    expect(snap.top).toHaveLength(2);
  });
});

describe("getSnapshot", () => {
  it("returns null when the refresh token is missing (no fetch)", async () => {
    delete process.env.SPOTIFY_REFRESH_TOKEN;
    const spy = vi.fn();
    global.fetch = spy as unknown as typeof fetch;
    const { getSnapshot } = await import("./api");
    expect(await getSnapshot()).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("pickSource", () => {
  it("selects the weighted source for a cumulative r", async () => {
    const { pickSource } = await import("./api");
    const pool = [
      { kind: "liked" as const, total: 10 },
      { kind: "playlist" as const, id: "a", name: "A", total: 5 },
      { kind: "playlist" as const, id: "b", name: "B", total: 2 },
    ];
    expect(pickSource(pool, 0).kind).toBe("liked");
    expect(pickSource(pool, 9).kind).toBe("liked");
    expect(pickSource(pool, 10)).toMatchObject({ id: "a" });
    expect(pickSource(pool, 14)).toMatchObject({ id: "a" });
    expect(pickSource(pool, 15)).toMatchObject({ id: "b" });
    expect(pickSource(pool, 16)).toMatchObject({ id: "b" }); // past-end clamps to last
  });
});

describe("buildSourcePool", () => {
  it("keeps liked songs and only owned playlists with more than 20 tracks", async () => {
    global.fetch = mockFetch([
      [TOKEN, () => ok({ access_token: "at", expires_in: 3600 })],
      [
        "/me/playlists",
        () =>
          ok({
            items: [
              { id: "p1", name: "Mine Big", owner: { id: "santi" }, items: { total: 50 } },
              { id: "p2", name: "Mine Small", owner: { id: "santi" }, items: { total: 5 } },
              { id: "p3", name: "Not Mine", owner: { id: "other" }, items: { total: 99 } },
              { id: "p4", name: "Exactly 20", owner: { id: "santi" }, items: { total: 20 } },
            ],
            next: null,
          }),
      ],
      ["/me/tracks", () => ok({ total: 2605 })],
      ["/me", () => ok({ id: "santi" })],
    ]) as unknown as typeof fetch;

    const { buildSourcePool } = await import("./api");
    const pool = await buildSourcePool();
    expect(pool.find((s) => s.kind === "liked")?.total).toBe(2605);
    const playlists = pool.filter((s) => s.kind === "playlist") as { id: string }[];
    expect(playlists.map((s) => s.id)).toEqual(["p1"]); // p2 too small, p3 not owned, p4 not > 20
  });
});

describe("getRecommendation", () => {
  it("returns null when the refresh token is missing", async () => {
    delete process.env.SPOTIFY_REFRESH_TOKEN;
    const { getRecommendation } = await import("./api");
    expect(await getRecommendation()).toBeNull();
  });
});

describe("getAccessToken", () => {
  it("memoizes: two calls make one token request", async () => {
    const f = mockFetch([[TOKEN, () => ok({ access_token: "at", expires_in: 3600 })]]);
    global.fetch = f as unknown as typeof fetch;
    const { getAccessToken } = await import("./api");
    await getAccessToken();
    await getAccessToken();
    const tokenCalls = f.mock.calls.filter((c) => String(c[0]).includes(TOKEN));
    expect(tokenCalls).toHaveLength(1);
  });
});
