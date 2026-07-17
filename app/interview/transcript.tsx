"use client";

import { useRef, useState } from "react";
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
            {renderEmphasis(part.text)}
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
  const chips = SUGGESTIONS.filter((s) => !asked.has(s)).slice(0, 3);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    sendMessage({ text: q });
    setInput("");
    // A clicked chip unmounts (filtered out of `chips` once asked), taking
    // focus with it — land the keyboard back on the input, not <body>.
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto mt-12 w-full max-w-[72ch]">
      <div role="log" aria-live="polite" aria-label="Interview transcript">
        {messages.length === 0 && (
          <p className="border-t border-shadow-ink/20 pt-6 text-lg text-shadow-ink max-w-[65ch]">
            The subject is at the table, coffee in hand. Ask anything — the
            work, this site, the record player.
          </p>
        )}
        {messages.map((message, i) =>
          message.role === "user" ? (
            <p
              key={message.id}
              className="mt-10 border-t border-shadow-ink/20 pt-5 text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink"
            >
              <span aria-hidden>Q — </span>
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
        {busy && (
          <p aria-hidden className="mt-4 text-lg">
            <span className="interview-cursor">▮</span>
          </p>
        )}
        {error && (
          <p className="mt-6 border border-shadow-ink/20 p-4 text-shadow-ink max-w-[65ch]">
            The line to Buenos Aires dropped. Ask again.
          </p>
        )}
      </div>

      {chips.length > 0 && (
        <ul className="mt-10 flex flex-wrap gap-3" aria-label="Suggested questions">
          {chips.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => ask(s)}
                disabled={busy}
                className="interview-chip px-4 py-2 text-sm font-medium"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="sticky bottom-0 mt-10 flex gap-3 bg-paper pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Ask the subject…"
          aria-label="Ask Santiago a question"
          className="w-full rounded-[var(--radius-pill)] border border-shadow-ink/30 bg-white px-5 py-3 text-base outline-none focus-visible:border-poppy"
        />
        <button
          type="submit"
          disabled={busy || input.trim().length === 0}
          className="btn btn-letterpress rounded-[var(--radius-ticket)] bg-poppy px-6 py-3 text-sm font-medium uppercase tracking-[0.08em] text-ink disabled:opacity-50"
        >
          {busy ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
