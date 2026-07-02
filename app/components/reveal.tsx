"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Once-only scroll entrance for a block of `.reveal-item` children
 * (globals.css → Scroll reveal). CSS owns the animation and reduced-motion;
 * this only flips classes at 20% visibility, same contract the work cards
 * used since M2. Children render normally without JS.
 */
export function Reveal({
  as: Tag = "div",
  className,
  children,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("will-enter");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
