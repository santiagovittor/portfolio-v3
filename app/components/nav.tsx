"use client";

import { useEffect, useRef, useState } from "react";
import { Grain } from "./grain";

/**
 * Glass over anything tagged data-nav-theme="dark", ink-on-glass everywhere
 * else (DESIGN.md → Scroll transition). Content-aware, not scroll-position-
 * aware: an IntersectionObserver watches every data-nav-theme="dark"
 * element in the document and flips theme based on how many currently
 * intersect the fixed nav's own height band at the top of the viewport.
 * variant="paper" pins the ink style for pages without a hero.
 *
 * Below md the link pill doesn't fit next to the logo, so the nav collapses
 * to SV + a Menu button that opens a full-screen paper contents sheet
 * (native <dialog>). Desktop (md+) keeps the centered pill untouched.
 */
export function Nav({ variant = "hero" }: { variant?: "hero" | "paper" }) {
  const [onDark, setOnDark] = useState(variant === "hero");
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const onPaper = variant === "paper" || !onDark;

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

  // Ticket-radius on mobile (avoids a rounded pill floating over the
  // hero card's sharp corner with almost no mat clearance), full pill
  // from sm: up where there's room to actually read as "floating".
  const glass = onPaper
    ? "rounded-[var(--radius-ticket)] sm:rounded-full border border-ink/20 bg-ink/5 backdrop-blur-md"
    : "rounded-[var(--radius-ticket)] sm:rounded-full border border-white/25 bg-white/12 backdrop-blur-md";
  const text = onPaper
    ? "text-ink [text-shadow:0_1px_1px_rgba(255,255,255,0.5)]"
    : "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]";
  const hover = onPaper ? "hover:bg-ink/10" : "hover:bg-white/15";
  const base = variant === "paper" ? "/" : "";

  const links = [
    { href: `${base}#work`, label: "Work" },
    { href: `${base}#about`, label: "About" },
    { href: `${base}#contact`, label: "Contact" },
    { href: "/interview", label: "Interview" },
  ];

  return (
    <header
      ref={headerRef}
      className="nav-frame fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 transition-colors duration-300"
    >
      <a
        href={`${base}#top`}
        className={`shrink-0 font-medium tracking-tight transition-colors duration-300 ${text}`}
        aria-label="SV, Santiago Vittor, home"
      >
        SV
      </a>
      {/* Concentric pill: uniform 4px inset all around (p-1), so the hover
          pill reads as the same shape as its container. md+ only. */}
      <nav
        aria-label="Main"
        className={`${glass} hidden p-1 transition-colors duration-300 md:absolute md:left-1/2 md:block md:-translate-x-1/2`}
      >
        <ul className={`flex items-center text-sm font-medium transition-colors duration-300 ${text}`}>
          {links.map((l) => (
            <li key={l.label} className="shrink-0">
              <a
                href={l.href}
                className={`block rounded-[var(--radius-ticket)] px-4 py-2 transition-colors duration-200 sm:rounded-full ${hover}`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-3">
        <a
          href={`${base}#contact`}
          className={`${glass} ${text} hidden px-5 py-2.5 text-sm font-medium transition-colors duration-300 md:block ${hover}`}
        >
          Get in touch
        </a>
        <button
          type="button"
          onClick={() => menuRef.current?.showModal()}
          aria-haspopup="dialog"
          className={`${glass} ${text} px-4 py-2 text-sm font-medium transition-colors duration-300 md:hidden ${hover}`}
        >
          Menu
        </button>
      </div>

      <dialog ref={menuRef} className="menu-sheet" aria-label="Menu">
        <div className="laid-paper flex h-full flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7">
          <div className="flex items-center justify-between">
            <span aria-hidden className="font-medium tracking-tight">
              SV
            </span>
            <button
              type="button"
              onClick={() => menuRef.current?.close()}
              className="rounded-[var(--radius-ticket)] border border-ink/20 bg-ink/5 px-4 py-2 text-sm font-medium"
            >
              Close
            </button>
          </div>
          <nav aria-label="Menu" className="mt-14">
            <ul className="border-y border-shadow-ink/15">
              {links.map((l, i) => (
                <li
                  key={l.label}
                  className="menu-in border-t border-shadow-ink/15 first:border-t-0"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <a
                    href={l.href}
                    onClick={() => menuRef.current?.close()}
                    className="block py-4 font-serif text-[2rem] italic leading-tight"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p
            className="menu-in mt-auto flex items-baseline justify-between text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink"
            style={{ "--i": links.length } as React.CSSProperties}
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
