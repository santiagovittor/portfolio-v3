"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "./ambient.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CARDS = [
  { q: "What did you ship at FoodStyles?", tilt: -2.5 },
  { q: "Why Buenos Aires?", tilt: 1.75 },
  { q: "How do you use AI day to day?", tilt: 3 },
];

export function AmbientSlice() {
  const rootRef = useRef<HTMLElement>(null);
  const numeralRef = useRef<HTMLSpanElement>(null);
  const vinylRef = useRef<SVGSVGElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const flyTextRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const innerRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const clamp = gsap.utils.clamp;
    const mm = gsap.matchMedia();

    mm.add(
      {
        motionOK: "(prefers-reduced-motion: no-preference)",
        finePointer: "(pointer: fine)",
      },
      (ctx) => {
        const { motionOK, finePointer } = ctx.conditions as {
          motionOK: boolean;
          finePointer: boolean;
        };
        if (!motionOK) return; // reduced motion: everything stays static

        const cleanups: (() => void)[] = [];

        // Lenis driven through gsap's ticker, lagSmoothing off (spec stack)
        const lenis = new Lenis();
        const raf = (time: number) => lenis.raf(time * 1000);
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        cleanups.push(() => {
          gsap.ticker.remove(raf);
          lenis.destroy();
        });

        // Vinyl: 8s per revolution; hover spins it down like a real platter
        const vinyl = vinylRef.current!;
        const spin = gsap.to(vinyl, {
          rotation: "+=360",
          duration: 8,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%",
        });
        const spinDown = () =>
          gsap.to(spin, { timeScale: 0, duration: 0.9, ease: "power2.out" });
        const spinUp = () =>
          gsap.to(spin, { timeScale: 1, duration: 0.9, ease: "power2.in" });
        vinyl.addEventListener("pointerenter", spinDown);
        vinyl.addEventListener("pointerleave", spinUp);
        cleanups.push(() => {
          spin.kill();
          vinyl.removeEventListener("pointerenter", spinDown);
          vinyl.removeEventListener("pointerleave", spinUp);
        });

        // Ghost numeral: scroll + mouse parallax, lerped, capped at ±30px
        let mx = 0,
          my = 0,
          sy = 0,
          x = 0,
          y = 0;
        const st = ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            sy = (self.progress - 0.5) * 44;
          },
        });
        const onMouse = (e: MouseEvent) => {
          mx = (e.clientX / window.innerWidth - 0.5) * 20;
          my = (e.clientY / window.innerHeight - 0.5) * 16;
        };
        window.addEventListener("mousemove", onMouse);
        const drift = () => {
          const gx = clamp(-30, 30, mx);
          const gy = clamp(-30, 30, my + sy);
          x += (gx - x) * 0.06;
          y += (gy - y) * 0.06;
          gsap.set(numeralRef.current, { x, y });
        };
        gsap.ticker.add(drift);
        cleanups.push(() => {
          st.kill();
          window.removeEventListener("mousemove", onMouse);
          gsap.ticker.remove(drift);
        });

        if (finePointer) {
          // Custom asterisk cursor: lerped follow, inverts via
          // mix-blend-mode: difference (see CSS), grows over interactives
          root.classList.add("amb-no-cursor");
          const cursor = cursorRef.current!;
          let cx = 0,
            cy = 0,
            tx = 0,
            ty = 0;
          const move = (e: PointerEvent) => {
            tx = e.clientX;
            ty = e.clientY;
          };
          const show = () => gsap.to(cursor, { autoAlpha: 1, duration: 0.2 });
          const hide = () => gsap.to(cursor, { autoAlpha: 0, duration: 0.2 });
          const follow = () => {
            cx += (tx - cx) * 0.3;
            cy += (ty - cy) * 0.3;
            gsap.set(cursor, { x: cx, y: cy });
          };
          const over = (e: Event) => {
            const hit = (e.target as Element).closest(
              "button, a, input, [data-cursor]",
            );
            gsap.to(cursor, {
              scale: hit ? 2.1 : 1,
              rotation: hit ? 45 : 0,
              duration: 0.25,
              ease: "power2.out",
            });
          };
          gsap.ticker.add(follow);
          window.addEventListener("pointermove", move);
          root.addEventListener("pointerenter", show);
          root.addEventListener("pointerleave", hide);
          root.addEventListener("pointerover", over);
          cleanups.push(() => {
            root.classList.remove("amb-no-cursor");
            gsap.ticker.remove(follow);
            window.removeEventListener("pointermove", move);
            root.removeEventListener("pointerenter", show);
            root.removeEventListener("pointerleave", hide);
            root.removeEventListener("pointerover", over);
          });

          // Marginalia cards: magnetic pull toward the cursor, max 8px.
          // The pull lives on the inner span so it never fights the outer
          // button's CSS tilt/lift.
          cardRefs.current.forEach((card, i) => {
            const inner = innerRefs.current[i];
            if (!card || !inner) return;
            const pull = (e: PointerEvent) => {
              const r = card.getBoundingClientRect();
              const dx = clamp(-8, 8, (e.clientX - (r.left + r.width / 2)) * 0.15);
              const dy = clamp(-8, 8, (e.clientY - (r.top + r.height / 2)) * 0.15);
              gsap.to(inner, { x: dx, y: dy, duration: 0.4, ease: "power3.out" });
            };
            const release = () =>
              gsap.to(inner, { x: 0, y: 0, duration: 0.5, ease: "power3.out" });
            card.addEventListener("pointermove", pull);
            card.addEventListener("pointerleave", release);
            cleanups.push(() => {
              card.removeEventListener("pointermove", pull);
              card.removeEventListener("pointerleave", release);
            });
          });
        }

        return () => cleanups.forEach((fn) => fn());
      },
    );

    return () => mm.revert();
  }, []);

  // Card → input: the note flies to the baseline, its text settles as ink.
  const fly = (i: number) => {
    const card = cardRefs.current[i];
    const target = flyTextRef.current;
    if (!card || !target) return;
    const q = CARDS[i].q;

    const settle = () => {
      target.textContent = q;
      if (!prefersReduced()) {
        gsap.fromTo(
          target,
          { letterSpacing: "0.05em", opacity: 0.4 },
          {
            letterSpacing: "0em",
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
            clearProps: "letterSpacing",
          },
        );
      }
      // integration hook: listen for this on the section (see README)
      target.dispatchEvent(
        new CustomEvent("amb-pick", { detail: q, bubbles: true }),
      );
    };

    if (prefersReduced()) {
      settle();
      return;
    }

    const c = card.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const dx = t.left - (c.left + c.width / 2);
    const dy = t.top + t.height / 2 - (c.top + c.height / 2);

    gsap
      .timeline()
      .to(card, {
        x: dx,
        y: dy,
        scale: 0.2,
        opacity: 0.85,
        duration: 0.55,
        ease: "power3.in",
      })
      .set(card, { opacity: 0 })
      .add(settle)
      // demo only: the card drifts back so the slice stays replayable —
      // in integration the card would stay spent (see README)
      .to(card, {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        delay: 0.9,
        duration: 0.5,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });
  };

  return (
    <section ref={rootRef} className="amb-root">
      {/* Film grain, scoped to the slice */}
      <div className="amb-grain" aria-hidden>
        <svg width="100%" height="100%">
          <filter id="amb-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#amb-noise)" />
        </svg>
      </div>

      {/* Ghost numeral, parallax-driven */}
      <span ref={numeralRef} className="ghost-numeral amb-numeral" aria-hidden>
        03
      </span>

      {/* Vinyl, 8s per turn, spins down on hover */}
      <div className="amb-vinyl" aria-hidden>
        <svg ref={vinylRef} viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="47" fill="var(--color-ink)" />
          <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(250,250,247,0.07)" />
          <circle cx="48" cy="48" r="34" fill="none" stroke="rgba(250,250,247,0.07)" />
          <circle cx="48" cy="48" r="28" fill="none" stroke="rgba(250,250,247,0.07)" />
          <path
            d="M 20 48 A 28 28 0 0 1 48 20"
            fill="none"
            stroke="rgba(250,250,247,0.16)"
            strokeWidth="1.5"
          />
          <circle cx="48" cy="48" r="16" fill="var(--color-sky)" />
          <circle cx="48" cy="48" r="15" fill="none" stroke="rgba(20,18,16,0.3)" />
          <circle cx="48" cy="48" r="2.5" fill="var(--color-paper)" />
        </svg>
      </div>

      <div className="amb-grid">
        <header className="amb-header">
          <p className="amb-eyebrow">Slice 02 — In conversation</p>
          <h1 className="amb-title">The ambient layer</h1>
          <p className="amb-sub">
            (The room hums along: grain, a slow record, notes in the margin.)
          </p>
        </header>

        {/* Marginalia: three index-card suggestions */}
        <ul className="amb-cards">
          {CARDS.map((c, i) => (
            <li key={c.q}>
              <button
                type="button"
                className="amb-card"
                style={{ "--tilt": `${c.tilt}deg` } as React.CSSProperties}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                onClick={() => fly(i)}
              >
                <span
                  className="amb-card-inner"
                  ref={(el) => {
                    innerRefs.current[i] = el;
                  }}
                >
                  <span className="amb-card-eyebrow">Ask about</span>
                  <span className="amb-card-q">{c.q}</span>
                  <svg
                    className="amb-underline"
                    viewBox="0 0 120 8"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path d="M2 5C30 1.5 62 7 118 3.5" pathLength={1} />
                  </svg>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Static transcript excerpt: context + scroll height for parallax */}
        <article className="amb-excerpt">
          <h2 className="amb-q">
            <span className="amb-q-marker" aria-hidden>
              Q —{" "}
            </span>
            What is this section, exactly?
          </h2>
          <p>
            A live interview. You ask, a stand-in answers in my words. The
            notes scattered in the margin are good places to start; the record
            keeps time.
          </p>
          <h2 className="amb-q">
            <span className="amb-q-marker" aria-hidden>
              Q —{" "}
            </span>
            And the big &ldquo;03&rdquo;?
          </h2>
          <p>
            Chapter number. It drifts a little as you read — scroll, or move
            the mouse. Everything on this page is listening.
          </p>
        </article>

        {/* Fly target: placeholder for the real input baseline */}
        <div className="amb-inputline" data-cursor>
          <span className="amb-label">Your question</span>
          <div className="amb-rule">
            <span ref={flyTextRef} className="amb-flytext" aria-live="polite" />
            <span className="amb-caret" aria-hidden />
          </div>
        </div>
      </div>

      {/* Custom cursor: asterisk, blend-difference (fine pointers only) */}
      <span ref={cursorRef} className="amb-cursor" aria-hidden>
        ✳
      </span>
    </section>
  );
}
