"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(useGSAP, SplitText, CustomEase);

/* The --ease-out-quart token, exactly. (The token name predates the curve:
   cubic-bezier(0.22, 1, 0.36, 1) is easeOutQuint, so no `powerN.out`
   approximation matches it — CustomEase does.) */
const EASE = CustomEase.create("heroEase", "0.22, 1, 0.36, 1");

/**
 * Hero headline. Each line rises from behind its own mask, so the type
 * reads as revealed rather than slid in over the photo.
 *
 * SplitText owns the masks and re-splits on resize (autoSplit) — the line
 * boxes have to be re-measured whenever the line breaks change, which is
 * the part that makes this effect hard to hand-roll. The two .hero-line
 * spans keep the composition's deliberate break; SplitText then adds any
 * further lines wrapping creates at narrow widths.
 *
 * The hidden state is set by GSAP, never in CSS: without JS the headline
 * must render as plain visible type, not an invisible <h1>.
 */
export function HeroHeadline() {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Under `reduce` the animation is never created — not created and
      // then disabled, which would still flash the masked state.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let split: SplitText | undefined;

        // Hide synchronously (useGSAP runs before paint) so the headline
        // never paints visible, snaps hidden, then reveals. Set from GSAP,
        // not CSS: without JS none of this runs and the h1 stays visible.
        gsap.set(ref.current, { autoAlpha: 0 });

        // Split after fonts settle: measuring line breaks against the
        // fallback face gives masks that don't match the final type. Capped
        // — a font that never resolves must not leave an invisible <h1>.
        Promise.race([
          document.fonts.ready,
          new Promise((r) => setTimeout(r, 1000)),
        ]).then(() => {
          if (!ref.current) return;
          gsap.set(ref.current, { autoAlpha: 1 });
          split = SplitText.create(ref.current, {
            type: "lines",
            mask: "lines",
            linesClass: "hero-split-line",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 100,
                duration: 0.6,
                stagger: 0.06,
                ease: EASE,
              }),
          });
        });

        return () => split?.revert();
      });

      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <h1
      ref={ref}
      className="hero-headline flex-1 text-[clamp(2.25rem,6.2vw,5.5rem)]"
    >
      <span className="hero-line">Designing interfaces.</span>{" "}
      <span className="hero-line">Engineering the rest.</span>
    </h1>
  );
}
