"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const PaperTextureLazy = dynamic(
  () => import("@paper-design/shaders-react").then((m) => m.PaperTexture),
  { ssr: false }
);

// Mount gate: WebGL2 support + first interaction (or a 6s fallback for
// visitors who only look). Keeps the shader chunk, its texture download and
// GL compile entirely out of the LCP/TBT window; the poster underneath is
// the fallback until then (and forever if WebGL2 is missing).
const WAKE_EVENTS = ["pointermove", "touchstart", "scroll", "keydown"] as const;
let awake = false;
const wakeCallbacks = new Set<() => void>();
function subscribeWake(cb: () => void) {
  wakeCallbacks.add(cb);
  if (!awake && wakeCallbacks.size === 1) {
    const fire = () => {
      if (awake) return;
      awake = true;
      WAKE_EVENTS.forEach((e) => window.removeEventListener(e, fire));
      wakeCallbacks.forEach((f) => f());
    };
    WAKE_EVENTS.forEach((e) =>
      window.addEventListener(e, fire, { once: true, passive: true })
    );
    setTimeout(fire, 6000);
  }
  return () => wakeCallbacks.delete(cb);
}

let webgl2Support: boolean | undefined;
const supportsWebGL2 = () =>
  (webgl2Support ??= !!document.createElement("canvas").getContext("webgl2"));

const getSnapshot = () => awake && supportsWebGL2();

export function HeroShader({ image }: { image: string }) {
  const ready = useSyncExternalStore(subscribeWake, getSnapshot, () => false);

  if (!ready) return null;

  return (
    <div aria-hidden className="absolute inset-0">
      <PaperTextureLazy
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
