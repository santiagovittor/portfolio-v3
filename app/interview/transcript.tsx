"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import type { InterviewMessage } from "@/lib/interview/types";
import { ContactCard, ProjectCard, TasteCard } from "./cards";
import type { TasteCategory } from "@/content/bible/taste";

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
    <p key={i} aria-hidden className="stage-in mt-6 font-serif italic text-shadow-ink">
      {STAGE_DIRECTIONS[i]}
    </p>
  );
}

const SUGGESTIONS = [
  "What do you actually do at FoodStyles?",
  "Pitch me this website.",
  "What's on the record player?",
  "How does this chatbot work?",
  "Show me your favorite project.",
  "Can I hire you?",
];

function renderPart(part: InterviewMessage["parts"][number]) {
  if (part.type === "tool-show_project" && part.state === "output-available") {
    return <ProjectCard slug={(part.output as { slug: string }).slug} />;
  }
  if (part.type === "tool-show_taste" && part.state === "output-available") {
    return (
      <TasteCard category={(part.output as { category: TasteCategory }).category} />
    );
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
            <WordReveal text={part.text} done={!isStreaming} />
          </p>
        ) : (
          <div key={i}>{renderPart(part)}</div>
        )
      )}
      {sources.length > 0 && (
        <p className="mt-3 font-serif text-sm italic text-shadow-ink">
          Sources: {sources.map((s) => s.label).join(" · ")}
        </p>
      )}
    </div>
  );
}

export function Transcript() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, sendMessage, status, error } = useChat<InterviewMessage>({
    transport: new DefaultChatTransport({ api: "/api/interview" }),
  });

  const busy = status === "submitted" || status === "streaming";
  const asked = new Set(
    messages
      .filter((m) => m.role === "user")
      .map((m) => m.parts.find((p) => p.type === "text")?.text)
  );
  const notes = SUGGESTIONS.filter((s) => !asked.has(s)).slice(0, 3);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    sendMessage({ text: q });
    setInput("");
    // A clicked note unmounts (filtered out of `notes` once asked), taking
    // focus with it. Land the keyboard back on the input, not <body>.
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto mt-12 w-full max-w-[72ch]">
      <div role="log" aria-live="polite" aria-label="Interview transcript">
        {messages.length === 0 && (
          <p className="border-t border-shadow-ink/20 pt-6 text-lg text-shadow-ink max-w-[65ch]">
            The subject is at the table, coffee in hand. Ask anything: the
            work, this site, the record player.
          </p>
        )}
        {messages.map((message, i) =>
          message.role === "user" ? (
            <p
              key={message.id}
              className="q-in mt-12 max-w-[60ch] border-t border-shadow-ink/20 pt-6 font-serif text-xl italic leading-snug"
            >
              <span className="sr-only">Question: </span>
              <span aria-hidden className="font-sans font-medium not-italic">
                Q —{" "}
              </span>
              {message.parts.find((p) => p.type === "text")?.text}
            </p>
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

      {notes.length > 0 && (
        <ul
          className="mt-12 flex flex-wrap items-start gap-4"
          aria-label="Suggested questions"
        >
          {notes.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => ask(s)}
                disabled={busy}
                className="interview-note"
                style={{ "--tilt": `${[-2, 1.5, 2.5][i % 3]}deg` } as React.CSSProperties}
              >
                <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-shadow-ink">
                  Ask about
                </span>
                <span className="mt-1 block font-serif italic">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="sticky bottom-0 mt-12 bg-paper pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <label
          htmlFor="interview-question"
          className="block text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink"
        >
          {busy ? "Hold, he's answering" : "Your question"}
        </label>
        <input
          ref={inputRef}
          id="interview-question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="(Lean in. Ask him anything.)"
          className="interview-input mt-1"
        />
      </form>
    </div>
  );
}
