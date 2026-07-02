"use client";

import { useEffect, useState } from "react";

/**
 * Glass on the hero, ink-on-glass once the work sheet covers it
 * (DESIGN.md → Scroll transition). Cover completes at 100svh of scroll.
 * variant="paper" pins the ink style for pages without a hero.
 */
export function Nav({ variant = "hero" }: { variant?: "hero" | "paper" }) {
  const [scrolled, setScrolled] = useState(false);
  const onPaper = variant === "paper" || scrolled;

  useEffect(() => {
    if (variant === "paper") return;
    let raf = 0;
    const check = () => {
      raf = 0;
      setScrolled(window.scrollY > window.innerHeight * 0.9);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [variant]);

  const glass = onPaper
    ? "rounded-full border border-ink/20 bg-ink/5 backdrop-blur-md"
    : "rounded-full border border-white/25 bg-white/12 backdrop-blur-md";
  const text = onPaper ? "text-ink" : "text-white";
  const hover = onPaper ? "hover:bg-ink/10" : "hover:bg-white/15";
  const base = variant === "paper" ? "/" : "";

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between p-4 transition-colors duration-300 md:px-8 md:py-6">
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
