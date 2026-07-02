"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

const MAX_PULL = 5;

/**
 * Reactbits "Magnet", toned down: the element leans a few px toward the
 * cursor while hovered, springs back on leave. Transform lives on this
 * wrapper so it never fights the .btn hover transform on the child.
 */
export function Magnet({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2 * MAX_PULL;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2 * MAX_PULL;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  };

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="magnet inline-block"
    >
      {children}
    </div>
  );
}
