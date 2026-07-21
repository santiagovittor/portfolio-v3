"use client";

import { useEffect, useRef, useState } from "react";
import { Grain } from "./grain";
import { PressMark } from "./press-mark";

/**
 * The masthead rail. Not a floating pill: a press mark on the left, a
 * numbered contents rail on one hairline rule in the middle, a rubber-stamped
 * CTA on the right — the top of a printed magazine page, and a running head
 * once you're inside one.
 *
 * Two observers, deliberately separate:
 *   1. Theme. Watches every [data-nav-theme="dark"] element (the hero card
 *      *and* dark work tiles mid-page) and flips glass/ink by how many
 *      intersect the nav's own height band. Content-aware, not scroll-
 *      position-aware. variant="paper" pins ink for pages without a hero.
 *   2. Running head. Watches main section[id] and marks which one owns the
 *      top band of the viewport. Different targets, different rootMargin,
 *      different meaning — do not merge them.
 *
 * Below md the rail doesn't fit, so it collapses to the mark + a CONTENTS
 * button opening the full-screen paper contents sheet (native <dialog>).
 */

/** Numbers are the sections' own ghost numerals (page.tsx, work.tsx,
 *  interview/page.tsx), not a private sequence. Change one, change both. */
const ENTRIES = [
  { n: "01", label: "Work", hash: "#work", section: "work" },
  { n: "02", label: "About", hash: "#about", section: "about" },
  { n: "03", label: "Interview", hash: null, section: null },
  { n: "04", label: "Contact", hash: "#contact", section: "contact" },
] as const;

const SECTION_ORDER: string[] = ENTRIES.flatMap((e) => e.section ?? []);

/** Opacity of the entries that aren't the running head. 0.7, not the 0.55
 *  this wants to be: at 0.55 the 11px section number drops under 4.5:1 on
 *  paper, and the number is content, not ornament. */
const DIM = 0.7;

/** Chinagraph ring: one imperfect loop whose ends cross past each other, the
 *  way a wax pencil marks a frame on a contact sheet. preserveAspectRatio
 *  none + non-scaling-stroke lets it stretch to any entry without the line
 *  weight stretching with it. Decorative — aria-current carries the meaning. */
function GreaseRing({ off }: { off: boolean }) {
  return (
    <svg
      aria-hidden
      data-off={off}
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className="grease-ring"
    >
      <path
        pathLength="1"
        d="M92 14C92 4 70 1 50 1.5C24 2 4 8 4 20C4 32 26 39 52 38.5C78 38 97 32 96 19C95.5 12 88 7 74 4.5"
        fill="none"
        stroke="var(--color-poppy)"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Nav({
  variant = "hero",
  runningHead,
}: {
  variant?: "hero" | "paper";
  /** Paper pages have no section list to run through, so they print their
   *  own running head after the mark. Passed in — never scraped from an h1. */
  runningHead?: string;
}) {
  const [onDark, setOnDark] = useState(variant === "hero");
  const [live, setLive] = useState<string | null>(null);
  const [ringed, setRinged] = useState<string | null>(null);
  const [erasing, setErasing] = useState(false);
  const ringedRef = useRef<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const onPaper = variant === "paper" || !onDark;

  // 1. Theme observer.
  useEffect(() => {
    if (variant === "paper") return;
    const header = headerRef.current;
    if (!header) return;

    const intersecting = new Set<Element>();
    let observer: IntersectionObserver | null = null;

    const setup = () => {
      observer?.disconnect();
      intersecting.clear();
      const navHeight = header.offsetHeight;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              intersecting.add(entry.target);
            } else {
              intersecting.delete(entry.target);
            }
          }
          setOnDark(intersecting.size > 0);
        },
        {
          rootMargin: `0px 0px -${window.innerHeight - navHeight}px 0px`,
          threshold: 0,
        }
      );
      document
        .querySelectorAll('[data-nav-theme="dark"]')
        .forEach((el) => observer!.observe(el));
    };

    setup();
    window.addEventListener("resize", setup);
    return () => {
      window.removeEventListener("resize", setup);
      observer?.disconnect();
    };
  }, [variant]);

  // 2. Running-head observer. A 10%-tall band near the top of the viewport:
  // narrow enough to mean "the page you are on", wide enough that a
  // Lenis-smoothed anchor jump can't skip over it.
  useEffect(() => {
    if (variant === "paper") return;
    const inBand = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        }
        const next = SECTION_ORDER.find((id) => inBand.has(id)) ?? null;
        setLive(next);

        // The ring lags the running head by one erase: the old loop draws
        // off in reverse before the new one draws on, so there are never
        // two on screen.
        if (next === ringedRef.current) {
          clearTimeout(timer);
          setErasing(false);
          return;
        }
        if (ringedRef.current === null) {
          ringedRef.current = next;
          setRinged(next);
          return;
        }
        setErasing(true);
        clearTimeout(timer);
        timer = setTimeout(() => {
          ringedRef.current = next;
          setRinged(next);
          setErasing(false);
        }, 260);
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 }
    );
    document
      .querySelectorAll("main section[id]")
      .forEach((el) => observer.observe(el));
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [variant]);

  const text = onPaper
    ? "text-ink"
    : "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]";
  const base = variant === "paper" ? "/" : "";
  const href = (e: (typeof ENTRIES)[number]) =>
    e.hash ? `${base}${e.hash}` : "/interview";

  return (
    <header
      ref={headerRef}
      className={`nav-frame fixed inset-x-0 top-0 z-40 flex items-center gap-4 transition-colors duration-300 ${text}`}
    >
      {/* Local scrim: the rail lost its glass, so over the photograph the
          type needs its own ground to hold 4.5:1. Nothing on paper. */}
      {!onPaper && <div aria-hidden className="nav-scrim" />}

      <a
        href={`${base}#top`}
        className="press-link flex shrink-0 items-center gap-3"
        aria-label="Santiago Vittor, home"
      >
        <PressMark className="h-7 w-11" />
        <span className="tape-label hidden lg:block">Santiago Vittor</span>
      </a>

      {runningHead && (
        <span className="tape-caption hidden min-w-0 truncate opacity-70 md:block">
          {runningHead}
        </span>
      )}

      <nav aria-label="Main" className="ml-auto hidden md:block">
        <ul className="nav-rail flex items-stretch">
          {ENTRIES.map((e) => {
            const isLive = e.section !== null && e.section === live;
            return (
              <li key={e.label} className="relative shrink-0">
                <a
                  href={href(e)}
                  aria-current={isLive ? "true" : undefined}
                  className="nav-entry link-draw flex items-baseline gap-[0.35em] px-4 py-1"
                  style={{ opacity: live && !isLive ? DIM : 1 }}
                >
                  <span className="nav-num">{e.n}</span>
                  <span className="tape-label">{e.label}</span>
                </a>
                {e.section !== null && e.section === ringed && (
                  <GreaseRing off={erasing} />
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <a
        href={`${base}#contact`}
        className="nav-stamp tape-label ml-6 hidden md:block"
      >
        Get in touch
      </a>

      <button
        type="button"
        onClick={() => menuRef.current?.showModal()}
        aria-haspopup="dialog"
        className="nav-stamp tape-label ml-auto md:hidden"
      >
        Contents
      </button>

      <dialog ref={menuRef} className="menu-sheet" aria-label="Contents">
        <div className="laid-paper flex h-full flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7">
          <div className="flex items-center justify-between">
            <PressMark className="h-7 w-11 text-ink" />
            <button
              type="button"
              onClick={() => menuRef.current?.close()}
              className="nav-stamp tape-label"
            >
              Close
            </button>
          </div>
          <nav aria-label="Contents" className="mt-14">
            <ul className="border-y border-shadow-ink/15">
              {ENTRIES.map((e, i) => {
                const isLive = e.section !== null && e.section === live;
                return (
                  <li
                    key={e.label}
                    className="menu-in relative border-t border-shadow-ink/15 first:border-t-0"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <a
                      href={href(e)}
                      aria-current={isLive ? "true" : undefined}
                      onClick={() => menuRef.current?.close()}
                      className="flex items-baseline gap-4 py-4"
                    >
                      <span className="nav-num w-8 shrink-0">{e.n}</span>
                      <span className="font-serif text-[2rem] italic leading-tight">
                        {e.label}
                      </span>
                    </a>
                    {e.section !== null && e.section === ringed && (
                      <GreaseRing off={erasing} />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
          <p
            className="menu-in mt-auto flex items-baseline justify-between text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink"
            style={{ "--i": ENTRIES.length } as React.CSSProperties}
          >
            <span>Santiago Vittor</span>
            <span>Buenos Aires, AR</span>
          </p>
        </div>
        <Grain className="absolute inset-0" />
      </dialog>
    </header>
  );
}
