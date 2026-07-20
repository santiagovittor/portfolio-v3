"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import type { InterviewMessage } from "@/lib/interview/types";
import { ContactCard, ProjectCard, TasteCard } from "./cards";
import { MusicCard, type MusicCardData } from "./music-card";
import type { TasteCategory } from "@/content/bible/taste";

// House style bans em dashes on this page. The system prompt asks the model
// to avoid them; this catches the ones that slip through anyway.
const deDash = (t: string) => t.replace(/[^\S\n]*—[^\S\n]*/g, ", ");

// Model output sometimes carries markdown emphasis (*Abbey Road*, **never**).
// No parts renderer for a fenced-off feature: this is a one-pass split for
// the two emphasis marks the corpus actually uses, not a markdown parser.
function renderEmphasis(text: string) {
  const pieces = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return pieces.map((piece, i) => {
    if (piece.startsWith("**") && piece.endsWith("**")) {
      return <strong key={i}>{piece.slice(2, -2)}</strong>;
    }
    if (piece.startsWith("*") && piece.endsWith("*")) {
      return <em key={i}>{piece.slice(1, -1)}</em>;
    }
    return piece;
  });
}

type Seg = { mark: "plain" | "em" | "strong"; text: string };

function parseEmphasis(text: string): Seg[] {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((p) => {
      if (p.startsWith("**") && p.endsWith("**"))
        return { mark: "strong" as const, text: p.slice(2, -2) };
      if (p.startsWith("*") && p.endsWith("*"))
        return { mark: "em" as const, text: p.slice(1, -1) };
      return { mark: "plain" as const, text: p };
    });
}

/**
 * Typesets an answer word by word at reading pace, each word settling from
 * a slight blur, regardless of how fast the model streams. Once the stream
 * is done and every word has landed, renders plain text again (screen
 * readers and long transcripts see ordinary paragraphs, not span soup).
 */
function WordReveal({ text, done }: { text: string; done: boolean }) {
  const [shown, setShown] = useState(() =>
    done ||
    (typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      ? Number.MAX_SAFE_INTEGER
      : 0,
  );

  const segs = useMemo(() => parseEmphasis(text), [text]);
  const totalWords = useMemo(
    () =>
      segs.reduce(
        (n, s) => n + s.text.split(/\s+/).filter(Boolean).length,
        0,
      ),
    [segs],
  );

  // One word per ~110ms while streaming; once the model is done, catch up
  // quickly so the reader never waits on an already-finished answer.
  useEffect(() => {
    if (shown >= totalWords) return;
    const t = setTimeout(
      () => setShown((s) => s + (done ? 4 : 1)),
      done ? 30 : 110,
    );
    return () => clearTimeout(t);
  }, [shown, totalWords, done]);

  if (done && shown >= totalWords) return <>{renderEmphasis(text)}</>;

  let w = 0;
  return (
    <>
      {segs.map((seg, si) => {
        const kids: ReactNode[] = [];
        for (const tk of seg.text.split(/(\s+)/)) {
          if (!tk) continue;
          if (/^\s+$/.test(tk)) {
            // whitespace (incl. newlines, preserved by pre-wrap) rides
            // along with the words already released
            if (w <= shown) kids.push(tk);
          } else {
            w++;
            if (w <= shown) {
              kids.push(
                <span key={w} className="word-in">
                  {tk}
                </span>,
              );
            }
          }
        }
        if (kids.length === 0) return null;
        if (seg.mark === "strong") return <strong key={si}>{kids}</strong>;
        if (seg.mark === "em") return <em key={si}>{kids}</em>;
        return <Fragment key={si}>{kids}</Fragment>;
      })}
    </>
  );
}

// Thinking state as stage directions, not a spinner. Decorative: the live
// region already announces the answer when it lands.
const STAGE_DIRECTIONS = [
  "(Santiago considers. Stirs his coffee.)",
  "(He glances at the record player.)",
  "(He straightens the notes on the table.)",
];

function StageDirection() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setI((n) => (n + 1) % STAGE_DIRECTIONS.length),
      2500,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <p key={i} aria-hidden className="tape-caption stage-in mt-6">
      {STAGE_DIRECTIONS[i]}
    </p>
  );
}

const SUGGESTIONS = [
  "What do you actually do at FoodStyles?",
  "Pitch me this website.",
  "Recommend a song.",
  "How does this chatbot work?",
  "Show me your favorite project.",
  "Can I hire you?",
];

const PLACEHOLDERS = [
  "(Lean in. Ask him anything.)",
  "(The tape is rolling.)",
  "(Ask about the work, the site, the records.)",
];

const stampFormat = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// The time a question hit the tape (visitor's clock). Lazy state
// initializer runs once on mount, so the stamp is fixed per message
// without reading a ref during render.
function Stamp() {
  const [t] = useState(() => stampFormat.format(new Date()));
  return <>{t}</>;
}

function renderPart(part: InterviewMessage["parts"][number]) {
  if (part.type === "tool-show_project" && part.state === "output-available") {
    return <ProjectCard slug={(part.output as { slug: string }).slug} />;
  }
  if (part.type === "tool-show_taste" && part.state === "output-available") {
    return (
      <TasteCard category={(part.output as { category: TasteCategory }).category} />
    );
  }
  if (part.type === "tool-now_spinning" && part.state === "output-available") {
    return <MusicCard snapshot={part.output as MusicCardData} />;
  }
  if (part.type === "tool-recommend_song" && part.state === "output-available") {
    return <MusicCard snapshot={part.output as MusicCardData} />;
  }
  if (part.type === "tool-contact_card" && part.state === "output-available") {
    return <ContactCard />;
  }
  return null; // unknown parts and in-flight tool states render nothing
}

function Answer({
  message,
  isStreaming,
}: {
  message: InterviewMessage;
  isStreaming: boolean;
}) {
  const offRecord = message.metadata?.offTheRecord;
  const sources = message.metadata?.sources ?? [];
  const lastTextIdx = message.parts.reduce(
    (acc, p, i) => (p.type === "text" ? i : acc),
    -1,
  );
  return (
    <div
      className={offRecord ? "font-serif italic" : ""}
      // role="log" announces additions as they happen; a streaming answer
      // mutates dozens of times, which some screen readers re-announce on
      // every token. Opt the in-progress text out and let it announce once,
      // complete, when streaming ends and this reverts to the ancestor's
      // aria-live="polite".
      aria-live={isStreaming ? "off" : undefined}
    >
      {message.parts.map((part, i) =>
        part.type === "text" ? (
          <p
            key={i}
            className="mt-4 max-w-[65ch] whitespace-pre-wrap text-lg leading-relaxed"
          >
            <WordReveal text={deDash(part.text)} done={!isStreaming} />
            {isStreaming && i === lastTextIdx && (
              <span className="type-caret" aria-hidden />
            )}
          </p>
        ) : (
          <div key={i}>{renderPart(part)}</div>
        )
      )}
      {sources.length > 0 && (
        <p className="tape-caption mt-3 text-sm">
          Sources: {sources.map((s) => s.label).join(" · ")}
        </p>
      )}
    </div>
  );
}

export function Transcript() {
  const [input, setInput] = useState("");
  const [ph, setPh] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // pinned-to-bottom like a real chat; scrolling up releases the pin
  const stickRef = useRef(true);
  const { messages, sendMessage, status, error } = useChat<InterviewMessage>({
    transport: new DefaultChatTransport({ api: "/api/interview" }),
  });

  const busy = status === "submitted" || status === "streaming";
  const notes = SUGGESTIONS.slice(0, 3);

  // idle placeholder cycles like the room is waiting
  useEffect(() => {
    const id = setInterval(
      () => setPh((n) => (n + 1) % PLACEHOLDERS.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  // keep the transcript pinned to its newest line while answers stream
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    stickRef.current = true;
    sendMessage({ text: q });
    setInput("");
    // A clicked note unmounts (notes hide once the interview starts),
    // taking focus with it. Land the keyboard back on the input, not <body>.
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto mt-6 flex min-h-0 w-full max-w-[72ch] flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        className="transcript-scroll min-h-0 flex-1 overflow-y-auto pb-6 pt-5 md:pt-8"
      >
        {messages.length === 0 && (
          <>
            {/* The suggestions are questions, so they wear the transcript's
                own question style, one size down. No label above them: a
                question mark already says what they are. */}
            <p className="tape-label border-t border-shadow-ink/20 pt-5">
              Suggested questions
            </p>
            <ul
              className="mt-4 flex flex-col border-b border-shadow-ink/15 md:mt-6 md:flex-row md:flex-wrap md:items-start md:gap-4 md:border-b-0"
              aria-label="Suggested questions"
            >
              {notes.map((s, i) => (
                <li
                  key={s}
                  className="border-t border-shadow-ink/15 md:border-t-0"
                >
                  <button
                    type="button"
                    onClick={() => ask(s)}
                    disabled={busy}
                    className="interview-note font-serif italic"
                    style={
                      { "--tilt": `${[-2, 1.5, 2.5][i % 3]}deg` } as React.CSSProperties
                    }
                  >
                    <span aria-hidden className="mr-2 text-shadow-ink">
                      Q.
                    </span>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <div role="log" aria-live="polite" aria-label="Interview transcript">
          {messages.map((message, i) =>
            message.role === "user" ? (
              <div
                key={message.id}
                className="q-in mt-10 border-t border-shadow-ink/20 pt-6 first:mt-0 first:border-t-0 first:pt-0"
              >
                <p className="flex items-baseline justify-between gap-4">
                  <span className="max-w-[56ch] font-serif text-xl italic leading-snug">
                    <span className="sr-only">Question: </span>
                    <span aria-hidden className="mr-1 text-shadow-ink">
                      Q.
                    </span>
                    {message.parts.find((p) => p.type === "text")?.text}
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 text-xs tabular-nums text-shadow-ink"
                  >
                    <Stamp />
                  </span>
                </p>
              </div>
            ) : (
              <Answer
                key={message.id}
                message={message}
                isStreaming={busy && i === messages.length - 1}
              />
            )
          )}
          {status === "submitted" && <StageDirection />}
          {error && (
            <p className="mt-6 border border-shadow-ink/20 p-4 text-shadow-ink max-w-[65ch]">
              The line to Buenos Aires dropped. Ask again.
            </p>
          )}
        </div>
      </div>

      <form
        className="border-t border-shadow-ink/15 bg-paper pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <div className="flex items-baseline justify-between">
          <label htmlFor="interview-question" className="tape-label block">
            {busy ? "Hold, he's answering" : "Your question"}
          </label>
          {busy && (
            <span
              aria-hidden
              className="tape-label flex items-center gap-2"
            >
              <span className="rec-dot" />
              Recording
            </span>
          )}
        </div>
        <input
          ref={inputRef}
          id="interview-question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder={PLACEHOLDERS[ph]}
          className="interview-input mt-1"
        />
      </form>
    </div>
  );
}
