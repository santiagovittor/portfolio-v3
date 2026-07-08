"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Glass over anything tagged data-nav-theme="dark", ink-on-glass everywhere
 * else (DESIGN.md → Scroll transition). Content-aware, not scroll-position-
 * aware: an IntersectionObserver watches every data-nav-theme="dark"
 * element in the document and flips theme based on how many currently
 * intersect the fixed nav's own height band at the top of the viewport.
 * variant="paper" pins the ink style for pages without a hero.
 */
export function Nav({ variant = "hero" }: { variant?: "hero" | "paper" }) {
  const [onDark, setOnDark] = useState(variant === "hero");
  const headerRef = useRef<HTMLElement>(null);
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

  const glass = onPaper
    ? "rounded-full border border-ink/20 bg-ink/5 backdrop-blur-md"
    : "rounded-full border border-white/25 bg-white/12 backdrop-blur-md";
  const text = onPaper ? "text-ink" : "text-white";
  const hover = onPaper ? "hover:bg-ink/10" : "hover:bg-white/15";
  const base = variant === "paper" ? "/" : "";

  return (
    <header
      ref={headerRef}
      className="nav-frame fixed inset-x-0 top-0 z-40 flex items-center justify-between transition-colors duration-300"
    >
      <a
        href={`${base}#top`}
        className={`font-medium tracking-tight transition-colors duration-300 ${text}`}
        aria-label="SV, Santiago Vittor, home"
      >
        SV
      </a>
      {/* Concentric pill: uniform 4px inset all around (p-1), so the hover
          pill reads as the same shape as its container */}
      <nav
        aria-label="Main"
        className={`${glass} absolute left-1/2 -translate-x-1/2 p-1 transition-colors duration-300`}
      >
        <ul className={`flex items-center text-sm font-medium transition-colors duration-300 ${text}`}>
          <li>
            <a href={`${base}#work`} className={`block rounded-full px-4 py-2 transition-colors duration-200 ${hover}`}>
              Work
            </a>
          </li>
          <li>
            <a href={`${base}#about`} className={`block rounded-full px-4 py-2 transition-colors duration-200 ${hover}`}>
              About
            </a>
          </li>
          <li>
            <a href={`${base}#contact`} className={`block rounded-full px-4 py-2 transition-colors duration-200 ${hover}`}>
              Contact
            </a>
          </li>
        </ul>
      </nav>
      <a
        href={`${base}#contact`}
        className={`${glass} ${text} hidden px-5 py-2.5 text-sm font-medium transition-colors duration-300 sm:block ${hover}`}
      >
        Get in touch
      </a>
    </header>
  );
}
