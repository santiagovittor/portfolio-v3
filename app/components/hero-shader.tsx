"use client";

import { FlutedGlass } from "@paper-design/shaders-react";
import { useEffect, useRef, useState } from "react";

/**
 * Shader layer over the hero poster (DESIGN.md → Shader rules).
 * Renders nothing until the client confirms: hydrated, WebGL2 available,
 * no reduced-motion preference. The poster underneath is the fallback.
 */
export function HeroShader({ image }: { image: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!document.createElement("canvas").getContext("webgl2")) return;
    setReady(true);
  }, []);

  // Library pauses on tab visibility but not offscreen — do that here.
  useEffect(() => {
    if (!ready || !ref.current) return;
    const io = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting)
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ready]);

  if (!ready) return null;

  return (
    <div ref={ref} aria-hidden className="absolute inset-0">
      <FlutedGlass
        image={image}
        // "Folds" preset values, slowed down (presets ship speed 0)
        shape="lines"
        distortionShape="cascade"
        distortion={0.75}
        size={0.4}
        shadows={0.4}
        blur={0.25}
        edges={0.5}
        margin={0}
        fit="cover"
        speed={inView ? 0.2 : 0}
        // Render scale is max(dpr, minPixelRatio); cap the equivalent of DPR 2
        maxPixelCount={window.innerWidth * window.innerHeight * 4}
        className="h-full w-full"
      />
    </div>
  );
}
