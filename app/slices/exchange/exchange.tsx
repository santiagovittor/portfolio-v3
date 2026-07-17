"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import {
  MOCK_ANSWERS,
  STAGE_DIRECTIONS,
  THINKING_MS,
  delay,
  streamAnswer,
} from "./mock";
import "./exchange.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(SplitText, ScrambleTextPlugin);
}

const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Status = "thinking" | "streaming" | "done";

type ExchangeItem = {
  id: number;
  question: string;
  topic: string;
  stamp: string; // tape time at the moment the question was asked
  status: Status;
};

function formatTape(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** The question line: lifts off the input, settles as set type,
 *  and its "Q —" marker resolves with a brief scramble. */
function QLine({ question }: { question: string }) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(rootRef.current, {
        y: 28,
        opacity: 0,
        duration: 0.45,
        ease: "power3.out",
      });
      // ink-settle: tracking tightens as the line commits to the page
      gsap.fromTo(
        textRef.current,
        { letterSpacing: "0.06em" },
        {
          letterSpacing: "0em",
          duration: 0.45,
          ease: "power2.out",
          clearProps: "letterSpacing",
        },
      );
      gsap.to(markerRef.current, {
        duration: 0.4,
        scrambleText: { text: "Q —", chars: "Q—–·*", speed: 0.8 },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <h3 ref={rootRef} className="xch-q">
      <span className="sr-only">Question: </span>
      <span ref={markerRef} className="xch-q-marker" aria-hidden>
        Q —
      </span>{" "}
      <span ref={textRef} className="xch-q-text">
        {question}
      </span>
    </h3>
  );
}

/** Stage-direction thinking state: italic lines crossfading every 2.5s. */
function ThinkingLine() {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (prefersReduced()) return; // static first line under reduced motion
    const id = setInterval(() => {
      gsap.to(ref.current, {
        opacity: 0,
        y: -4,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => setIndex((i) => (i + 1) % STAGE_DIRECTIONS.length),
      });
    }, 2500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (index === 0 || prefersReduced()) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
  }, [index]);

  return (
    <p ref={ref} className="xch-stage">
      {STAGE_DIRECTIONS[index]}
    </p>
  );
}

export function ExchangeSlice() {
  const [items, setItems] = useState<ExchangeItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [tape, setTape] = useState("00:00");
  const [announce, setAnnounce] = useState("");

  const startRef = useRef(0);
  const idRef = useRef(0);
  const nextAnswerRef = useRef(0);
  const answerEls = useRef(new Map<number, HTMLParagraphElement>());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startRef.current = performance.now();
  }, []);

  // running tape counter, alive only while recording
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(
      () => setTape(formatTape(performance.now() - startRef.current)),
      250,
    );
    return () => clearInterval(id);
  }, [busy]);

  // the answer <p> mounts one render after the item is added
  const waitForAnswerEl = (id: number) =>
    new Promise<HTMLParagraphElement>((resolve) => {
      const look = () => {
        const el = answerEls.current.get(id);
        if (el) resolve(el);
        else requestAnimationFrame(look);
      };
      look();
    });

  const onSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (!q || busy) return; // single-flight: one exchange at a time
    inputRef.current!.value = "";

    const mock = MOCK_ANSWERS[nextAnswerRef.current % MOCK_ANSWERS.length];
    nextAnswerRef.current += 1;
    const id = idRef.current++;
    const stamp = formatTape(performance.now() - startRef.current);

    setBusy(true);
    setAnnounce("Santiago is thinking.");
    setItems((xs) => [
      ...xs,
      { id, question: q, topic: mock.topic, stamp, status: "thinking" },
    ]);

    await delay(THINKING_MS);
    setItems((xs) =>
      xs.map((x) => (x.id === id ? { ...x, status: "streaming" } : x)),
    );

    const rm = prefersReduced();
    const el = await waitForAnswerEl(id);
    let first = true;
    for await (const chunk of streamAnswer(mock.text)) {
      if (!el.isConnected) break;
      const span = document.createElement("span");
      span.textContent = (first ? "" : " ") + chunk;
      el.appendChild(span);
      first = false;
      // document.hidden: rAF is paused in hidden tabs, so tweens would
      // freeze mid-blur and pile up — land words instantly instead
      if (!rm && !document.hidden) {
        const split = new SplitText(span, { type: "words" });
        gsap.from(split.words, {
          opacity: 0,
          y: 12,
          filter: "blur(4px)",
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.045,
          clearProps: "all",
        });
      }
      el.closest("section")?.scrollIntoView({
        block: "nearest",
        behavior: rm ? "auto" : "smooth",
      });
    }

    setItems((xs) =>
      xs.map((x) => (x.id === id ? { ...x, status: "done" } : x)),
    );
    // announce the whole answer once — per-chunk announcements are spam
    setAnnounce(mock.text);
    setBusy(false);
  };

  return (
    <div className="xch">
      <header>
        <p className="xch-eyebrow">Slice 01 — In conversation</p>
        <h1 className="xch-title">The exchange</h1>
      </header>

      <div className="xch-recwrap" aria-hidden>
        <div className={`xch-rec${busy ? " is-live" : ""}`}>
          <span className="xch-rec-dot" />
          REC
          <span className="xch-rec-tape">{tape}</span>
        </div>
      </div>

      <article className="xch-transcript" aria-label="Interview transcript">
        {items.map((x) => (
          <section key={x.id} className="xch-exchange">
            <div
              className={`xch-margin${x.status !== "thinking" ? " is-on" : ""}`}
              aria-hidden
            >
              <span className="xch-stamp">
                {x.stamp} — {x.topic}
              </span>
            </div>
            <div>
              <QLine question={x.question} />
              {x.status === "thinking" && <ThinkingLine />}
              <p
                className="xch-a"
                ref={(node) => {
                  if (node) answerEls.current.set(x.id, node);
                  else answerEls.current.delete(x.id);
                }}
              />
            </div>
          </section>
        ))}
      </article>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <form className="xch-form" onSubmit={onSubmit}>
        <label className="xch-label" htmlFor="xch-question">
          {busy ? "Hold — he's answering" : "Your question"}
        </label>
        <div className="xch-inputline">
          <input
            ref={inputRef}
            id="xch-question"
            className="xch-input"
            type="text"
            autoComplete="off"
            placeholder="(Lean in. Ask him anything.)"
          />
          <span className="xch-caret" aria-hidden />
        </div>
      </form>
    </div>
  );
}
