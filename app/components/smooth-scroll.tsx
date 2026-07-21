"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import "lenis/dist/lenis.css";

/**
 * Site-wide smooth scroll. Lenis animates the real scrollTop rather than
 * transforming a wrapper, so the hero's native
 * `animation-timeline: scroll(root)` keeps running in lockstep.
 *
 * Driven off GSAP's ticker, not a second rAF loop: one clock for the whole
 * site, no two engines drifting apart.
 */
export function SmoothScroll() {
  useEffect(() => {
    // Hijacked scroll is a vestibular trigger. Under `reduce` Lenis is never
    // constructed — native scroll only.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ anchors: true });
    const raf = (time: number) => lenis.raf(time * 1000); // gsap ticker is in seconds
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
