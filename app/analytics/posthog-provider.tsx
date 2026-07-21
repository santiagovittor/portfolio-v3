"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { track } from "@/lib/analytics/client";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Cookieless analytics.
 *
 * CLAUDE.md bans cookies and localStorage, so PostHog runs with
 * `persistence: "memory"`: identity lives in a JS variable for the life of the
 * tab and dies with it. Soft navigations (the whole site is one App Router
 * SPA) keep the same session; a hard reload starts a new one. Nothing is
 * written to the visitor's machine, so no consent banner is required in the
 * EU/UK, which is where most of the traffic is.
 *
 * The trade-off: no cross-visit identity. A returning visitor looks like a new
 * one. See TUTORIAL.md → "Cookieless mode" for what changes if that stops
 * being an acceptable price.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return; // no key configured (local dev, forks) → no-op

    posthog.init(key, {
      // Same-origin proxy (next.config.ts rewrites). Keeps the requests
      // first-party so ad blockers and strict CSPs don't eat the data.
      api_host: "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://us.posthog.com",

      persistence: "memory",
      // Memory persistence means every page load would otherwise mint a new
      // person profile. Stay anonymous: events still carry session, device,
      // geo and referrer, and the billing stays flat.
      person_profiles: "identified_only",

      // App Router does client-side navigation, so listen to history instead
      // of relying on a full document load.
      capture_pageview: "history_change",
      capture_pageleave: true, // gives time-on-page and scroll depth
      autocapture: true, // every click/submit, without hand-instrumenting
      capture_performance: { web_vitals: true },
      capture_dead_clicks: true,
      rageclick: true,

      session_recording: {
        maskAllInputs: true,
        maskInputFn: (text, element) =>
          // The interview question box is the one input worth reading back:
          // it's the whole point of the chat. Everything else stays masked.
          element?.id === "interview-question" ? text : "*".repeat(text.length),
      },
      // The brief asks for everything registered, so DNT is not honoured.
      // Flip to true (TUTORIAL.md → "Do Not Track") to change that.
      respect_dnt: false,

      defaults: "2025-05-24",
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.debug();
      },
    });
  }, []);

  return children;
}

/**
 * Two things autocapture records but doesn't name well:
 * outbound clicks (buried in $autocapture) and which sections of the long
 * scroll a visitor actually reached. Both are delegated/observed globally so
 * no component has to know analytics exists.
 */
export function PageSignals() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a?.href) return;
      let url: URL;
      try {
        url = new URL(a.href, location.href);
      } catch {
        return;
      }
      if (url.origin === location.origin || !url.protocol.startsWith("http")) return;
      track(EVENTS.outboundLinkClicked, {
        href: url.href,
        host: url.host,
        label: a.textContent?.trim().slice(0, 80),
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Re-observed on every route change: soft navigation swaps the sections out
  // from under a one-shot observer.
  useEffect(() => {
    // Section reach: fires once per section per page load, and only if the
    // section sat in the middle band of the viewport for a second (a
    // scroll-past isn't a read).
    //
    // The band, not a ratio threshold: on a phone the work grid is several
    // screens tall, so "50% of the section is visible" can never be true and
    // a threshold-based observer would silently never fire.
    const seen = new Set<string>();
    const timers = new Map<Element, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target;
          const id = el.id || el.getAttribute("aria-label") || "unnamed";
          if (entry.isIntersecting && !seen.has(id)) {
            timers.set(
              el,
              window.setTimeout(() => {
                seen.add(id);
                track(EVENTS.sectionViewed, {
                  section: id,
                  path: location.pathname,
                });
              }, 1000),
            );
          } else {
            const t = timers.get(el);
            if (t) {
              clearTimeout(t);
              timers.delete(el);
            }
          }
        }
      },
      { rootMargin: "-25% 0px -25% 0px", threshold: 0 },
    );
    document.querySelectorAll("main section[id], main [data-section]").forEach((el) => io.observe(el));

    return () => {
      timers.forEach((t) => clearTimeout(t));
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
