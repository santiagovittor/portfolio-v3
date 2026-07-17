"use client";

// The B-side: Santiago's live Spotify listening as a record sleeve in the
// page's language. Resting state is 100% our design; the Spotify iframe only
// mounts after a visitor presses play (so their third-party cookies and any
// Spotify network traffic load on demand, never on page load). Falls back to
// the static taste card whenever live data is unavailable.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { SpotifySnapshot, SpotifyTrack } from "@/lib/spotify/api";
import { TasteCard } from "./cards";

export type MusicCardData = SpotifySnapshot | { unavailable: true };

// Minimal shape of Spotify's iFrame Embed API (no @types package ships one).
type SpotifyController = {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  destroy: () => void;
  addListener: (
    event: "playback_update",
    cb: (e: { data: { isPaused: boolean; isBuffering: boolean } }) => void,
  ) => void;
};
type SpotifyIFrameAPI = {
  createController: (
    el: HTMLElement,
    opts: { uri: string; width?: string | number; height?: number },
    cb: (ctrl: SpotifyController) => void,
  ) => void;
};
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

// One script for the whole page, injected on the first play click, ever.
let apiPromise: Promise<SpotifyIFrameAPI> | null = null;
function loadIframeApi(): Promise<SpotifyIFrameAPI> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    window.onSpotifyIframeApiReady = resolve;
    const s = document.createElement("script");
    s.src = "https://open.spotify.com/embed/iframe-api/v1";
    s.async = true;
    document.body.appendChild(s);
  });
  return apiPromise;
}

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Argentina/Buenos_Aires",
});

function Art({ track, className }: { track: SpotifyTrack; className?: string }) {
  if (track.artUrl) {
    return (
      <Image
        src={track.artUrl}
        alt={`${track.album} sleeve`}
        width={128}
        height={128}
        className={`h-full w-full object-cover ${className ?? ""}`}
      />
    );
  }
  // No art: a typographic sleeve, never a broken image.
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-shadow-ink/10 ${className ?? ""}`}
      aria-hidden
    >
      <span className="font-serif text-2xl italic text-shadow-ink">
        {track.album.trim()[0]?.toUpperCase() ?? "?"}
      </span>
    </div>
  );
}

export function MusicCard({ snapshot }: { snapshot: MusicCardData }) {
  const [activeTrack, setActiveTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const controllerRef = useRef<SpotifyController | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => controllerRef.current?.destroy(), []);

  // Hooks must run unconditionally, so the early returns come after them.
  if ("unavailable" in snapshot) return <TasteCard category="music" />;

  const lead = snapshot.nowPlaying ?? snapshot.recent[0] ?? snapshot.top[0] ?? null;
  if (!lead) return <TasteCard category="music" />;

  // rotation = recent tracks minus whatever is already the lead, then top as
  // filler so the sleeve is never a one-liner.
  const rotation: SpotifyTrack[] = [];
  const seen = new Set<string>([lead.id]);
  for (const t of [...snapshot.recent, ...snapshot.top]) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    rotation.push(t);
    if (rotation.length === 3) break;
  }

  const display = activeTrack ?? lead;
  const spinning = isPlaying || (!activeTrack && !!snapshot.nowPlaying);
  const label = spinning ? "now spinning" : "last spun";

  async function toggle(track: SpotifyTrack) {
    const uri = `spotify:track:${track.id}`;
    if (!controllerRef.current) {
      const api = await loadIframeApi();
      await new Promise<void>((resolve) => {
        api.createController(hostRef.current!, { uri, width: "100%", height: 80 }, (ctrl) => {
          controllerRef.current = ctrl;
          ctrl.addListener("playback_update", (e) =>
            setIsPlaying(!e.data.isPaused && !e.data.isBuffering),
          );
          resolve();
        });
      });
      setMounted(true);
      controllerRef.current!.play();
      setActiveTrack(track);
      return;
    }
    if (activeTrack?.id === track.id) {
      if (isPlaying) controllerRef.current.pause();
      else controllerRef.current.play();
      return;
    }
    // play() must stay inside the click gesture (deferring it past the gesture
    // gets autoplay-blocked). ponytail: Spotify's compact embed sometimes loads
    // the swapped track paused-and-ready rather than auto-resuming; the visitor
    // taps play once more. Not worth fighting the embed's timing.
    controllerRef.current.loadUri(uri);
    controllerRef.current.play();
    setActiveTrack(track);
  }

  const leadActive = activeTrack?.id === display.id && isPlaying;

  return (
    <figure className="plate q-in mt-6 max-w-md bg-white/40 p-4">
      {/* eyebrow: small-caps label + live dot, b-side tag on the right */}
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink">
          <span className="bside-dot" data-playing={spinning} aria-hidden />
          {label}
          {spinning && <span className="sr-only">, playing</span>}
        </span>
        <span className="font-serif text-xs italic text-shadow-ink">
          b-side · live from spotify
        </span>
      </figcaption>

      {/* lead row: the turntable. Art shows the active track, spins on play. */}
      <div className="mt-3 flex items-center gap-4">
        <div
          className="bside-art relative h-16 w-16 shrink-0 overflow-hidden bg-shadow-ink/5"
          data-playing={leadActive}
        >
          <div className="bside-disc h-full w-full">
            <Art track={display} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{display.name}</p>
          <p className="truncate font-serif text-sm italic text-shadow-ink">
            {display.artists.join(", ")} · {display.album}
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggle(display)}
          aria-pressed={leadActive}
          aria-label={leadActive ? `Pause ${display.name}` : `Play ${display.name}`}
          className="bside-play shrink-0 text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink"
        >
          {leadActive ? "❚❚ pause" : "▸ play"}
        </button>
      </div>

      {/* the Spotify player mounts here, once, on first play */}
      <div className={mounted ? "mt-3" : "sr-only"}>
        <div ref={hostRef} />
      </div>

      {rotation.length > 0 && (
        <>
          <p className="mt-4 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.12em] text-shadow-ink">
            <span className="h-px flex-1 bg-shadow-ink/20" />
            recent rotation
            <span className="h-px flex-1 bg-shadow-ink/20" />
          </p>
          <ul className="mt-2">
            {rotation.map((t, i) => {
              const active = activeTrack?.id === t.id && isPlaying;
              return (
                <li key={t.id} className="border-t border-shadow-ink/12 first:border-t-0">
                  <button
                    type="button"
                    onClick={() => toggle(t)}
                    aria-pressed={active}
                    aria-label={active ? `Pause ${t.name}` : `Play ${t.name}`}
                    className="bside-row flex w-full items-baseline gap-3 py-2 text-left"
                  >
                    <span
                      aria-hidden
                      className="w-6 shrink-0 font-serif text-xs italic text-shadow-ink"
                    >
                      {active ? "▸" : `B${i + 1}`}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.name}</span>
                    <span className="shrink-0 truncate font-serif text-sm italic text-shadow-ink">
                      {t.artists.join(", ")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-shadow-ink/12 pt-3 text-xs">
        <a
          href={display.url}
          target="_blank"
          rel="noreferrer"
          className="link-draw font-medium"
        >
          open in spotify ↗
        </a>
        <span className="font-serif italic tabular-nums text-shadow-ink">
          fetched {timeFmt.format(new Date(snapshot.fetchedAt))} ART
        </span>
      </div>
    </figure>
  );
}
