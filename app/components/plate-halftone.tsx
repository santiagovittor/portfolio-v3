"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { PaperShaderElement } from "@paper-design/shaders";

const HalftoneCmykLazy = dynamic(
  () => import("@paper-design/shaders-react").then((m) => m.HalftoneCmyk),
  { ssr: false }
);

// Cards top out around 1000px wide (90vw on tablets); this caps the render
// at that footprint × DPR 2, same policy as the hero's cap.
const MAX_PIXELS = 1000 * 750 * 4;
const READY_DEADLINE_MS = 3000;

let webgl2Support: boolean | undefined;
const supportsWebGL2 = () =>
  (webgl2Support ??= !!document.createElement("canvas").getContext("webgl2"));

/**
 * "Wet ink" enhancement over a work-card cover: a static CMYK halftone in
 * the brand inks, painted above the card's next/image. CSS (globals.css →
 * .plate-halftone) fades it out on hover/focus/.is-resolved, revealing the
 * photo. The photo beneath is the permanent fallback — no WebGL2, reduced
 * motion, JS off, or a slow first frame all leave the site looking as it
 * does today.
 */
export function PlateHalftone({ image }: { image: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [phase, setPhase] = useState<"waiting" | "ready" | "gave-up">(
    "waiting"
  );

  // Mount gate: reduced motion never mounts, WebGL2 required, and the
  // shader only exists while the card is near the viewport (pause = unmount).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        // GL probe deferred to first intersection: creating a WebGL2 context
        // costs real main-thread time and this effect runs during hydration —
        // probing at mount put ~1.4s of TBT inside the LCP window on
        // throttled mobile.
        if (entry.isIntersecting && !supportsWebGL2()) {
          io.disconnect();
          return;
        }
        setNear(entry.isIntersecting);
        if (!entry.isIntersecting) setPhase((p) => (p === "ready" ? "waiting" : p));
      },
      // Tight margin on purpose: the first card sits just past one viewport
      // below the hero, so anything ≥15% would mount shaders during the LCP
      // window on load. 10% means mounting starts with the first real scroll.
      { rootMargin: "10% 0px" }
    );
    io.observe(el);

    // Touch/no-hover: resolve the ink once when the card is 60% in view
    // (one-way, same policy as reveal.tsx).
    const tile = el.closest(".tile");
    let resolveIo: IntersectionObserver | undefined;
    if (tile && window.matchMedia("(hover: none)").matches) {
      resolveIo = new IntersectionObserver(
        ([entry]) => {
          if (entry.intersectionRatio >= 0.6) {
            tile.classList.add("is-resolved");
            resolveIo?.disconnect();
          }
        },
        { threshold: 0.6 }
      );
      resolveIo.observe(tile);
    }

    return () => {
      io.disconnect();
      resolveIo?.disconnect();
    };
  }, []);

  // Ready gate: same poll as hero-shader.tsx — the vanilla ShaderMount sets
  // `paperShaderMount` on its host div once GL is live, and paints a tick
  // later; fade in only after that, give up quietly on slow devices.
  useEffect(() => {
    if (!near || phase !== "waiting") return;
    let raf = 0;
    const deadline = performance.now() + READY_DEADLINE_MS;
    const check = () => {
      const host = wrapRef.current?.firstElementChild as
        | PaperShaderElement
        | null
        | undefined;
      if (host?.paperShaderMount) {
        raf = requestAnimationFrame(() =>
          requestAnimationFrame(() => setPhase("ready"))
        );
        return;
      }
      if (performance.now() > deadline) {
        setPhase("gave-up");
        return;
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [near, phase]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={`plate-halftone pointer-events-none absolute inset-0 ${
        phase === "ready" ? "is-ready" : ""
      }`}
    >
      {near && phase !== "gave-up" && (
        <HalftoneCmykLazy
          image={image}
          // `newspaper` preset re-inked in the brand palette (PLAN.md → M7):
          // sky stands in for cyan, poppy for magenta (suppressed to specks),
          // yellow dropped — the reference is newsprint, not a rainbow.
          colorBack="#EFEAE1"
          colorC="#3D8BD9"
          colorM="#E86A17"
          colorY="#00000000"
          colorK="#141210"
          size={0.15}
          contrast={1.3}
          softness={0.2}
          grainSize={0}
          grainMixer={0}
          grainOverlay={0.2}
          gridNoise={0.5}
          floodK={0}
          gainC={0.1}
          gainM={-0.4}
          gainY={-1}
          gainK={-0.25}
          type="dots"
          speed={0}
          fit="cover"
          scale={1}
          maxPixelCount={MAX_PIXELS}
          className="h-full w-full"
        />
      )}
    </div>
  );
}
