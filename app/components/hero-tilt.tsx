"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/* Ceiling for the whole interaction: if a visitor consciously notices "an
   animation", it is too much. */
const MAX_TILT = 2; // deg
const MAX_DRIFT = 6; // px the type drifts against the photo
const SWEEP_TRAVEL = 22; // percent of the sweep layer's own width

/**
 * The hero print responds to the hand: it leans a few degrees toward the
 * cursor, the type drifts against the photo, and a soft specular band
 * tracks across the emulsion.
 *
 * The rotation lives on this wrapper, never on .hero-card — the card
 * already runs `hero-exit` off the scroll timeline, and a CSS animation's
 * transform beats anything set on the same element, so a tilt written onto
 * .hero-card would silently die the moment the page scrolls a pixel.
 *
 * gsap.quickTo, not a CSS transition: a transition restarts from the
 * current value on every pointermove, which reads as stepping under fast
 * cursor movement. quickTo keeps one continuous frame-rate-independent
 * tween running toward a moving target, so the card lags the hand slightly
 * and catches up — how a weighted physical object behaves.
 */
export function HeroTilt({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Never wired up under `reduce` or on touch — not wired up and then
      // ignored inside the handler.
      mm.add(
        "(prefers-reduced-motion: no-preference) and (pointer: fine)",
        () => {
          const el = ref.current;
          const card = el?.parentElement;
          if (!el || !card) return;
          const sweep = el.querySelector<HTMLElement>(".hero-sweep");
          const depth = el.querySelector<HTMLElement>(".hero-depth");

          const rx = gsap.quickTo(el, "rotationX", {
            duration: 0.6,
            ease: "power3",
          });
          const ry = gsap.quickTo(el, "rotationY", {
            duration: 0.6,
            ease: "power3",
          });
          const sx = sweep
            ? gsap.quickTo(sweep, "xPercent", { duration: 0.9, ease: "power3" })
            : null;
          const dx = depth
            ? gsap.quickTo(depth, "x", { duration: 0.6, ease: "power3" })
            : null;
          const dy = depth
            ? gsap.quickTo(depth, "y", { duration: 0.6, ease: "power3" })
            : null;

          const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return;
            const r = card.getBoundingClientRect();
            // -1..1 from the card's center, scaled to MAX_TILT. Not
            // rotate3d(y, x, 0, 4deg): that normalizes its axis vector and
            // discards magnitude, so one pixel off center snaps to full tilt.
            const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
            const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
            // The face turns toward the cursor: the near edge dips away.
            ry(nx * MAX_TILT);
            rx(-ny * MAX_TILT);
            // Type drifts with the lean, so it reads as sitting proud of the
            // emulsion rather than printed flat onto it.
            dx?.(nx * MAX_DRIFT);
            dy?.(ny * MAX_DRIFT);
            sx?.(nx * SWEEP_TRAVEL);
          };

          const onLeave = () => {
            rx(0);
            ry(0);
            dx?.(0);
            dy?.(0);
            sx?.(0);
          };

          card.addEventListener("pointermove", onMove);
          card.addEventListener("pointerleave", onLeave);
          return () => {
            card.removeEventListener("pointermove", onMove);
            card.removeEventListener("pointerleave", onLeave);
          };
        }
      );

      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="hero-tilt">
      {children}
    </div>
  );
}
