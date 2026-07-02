"use client";

import { PaperTexture } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";

/**
 * Shader layer over the hero poster (DESIGN.md → Shader rules).
 * PaperTexture is a static filter — vintage crumpled-print look, no
 * animation, so no offscreen pause needed. Renders nothing until the
 * client confirms hydration + WebGL2; the poster underneath is the fallback.
 */
export function HeroShader({ image }: { image: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!document.createElement("canvas").getContext("webgl2")) return;
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div aria-hidden className="absolute inset-0">
      <PaperTexture
        image={image}
        // "Details" preset (transparent colors = pure image filter), toned down
        colorFront="#ffffff33"
        colorBack="#00000000"
        contrast={0.45}
        roughness={0.3}
        fiber={0.15}
        fiberSize={0.15}
        crumples={0.55}
        crumpleSize={0.25}
        folds={1}
        foldCount={4}
        drops={0.2}
        seed={6}
        scale={1}
        fit="cover"
        // Render scale is max(dpr, minPixelRatio); cap the equivalent of DPR 2
        maxPixelCount={window.innerWidth * window.innerHeight * 4}
        className="h-full w-full"
      />
    </div>
  );
}
