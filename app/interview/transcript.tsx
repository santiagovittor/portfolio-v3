"use client";

import { useState } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import type { InterviewMessage } from "@/lib/interview/types";

const SUGGESTIONS = [
  "What do you actually do at FoodStyles?",
  "Pitch me this website.",
  "What's on the record player?",
  "How does this chatbot work?",
  "Show me your favorite project.",
  "Can I hire you?",
];

// Slice 4 replaces this body with tool cards. Must never throw on
// part types it doesn't know.
function renderPart(_part: InterviewMessage["parts"][number]) {
  return null;
}

function Answer({ message }: { message: InterviewMessage }) {
  const offRecord = message.metadata?.offTheRecord;
  const sources = message.metadata?.sources ?? [];
  return (
    <div className={offRecord ? "font-serif italic" : ""}>
      {message.parts.map((part, i) =>
        part.type === "text" ? (
          <p
            key={i}
            className="mt-4 max-w-[65ch] whitespace-pre-wrap text-lg leading-relaxed"
          >
            {part.text}
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
  };

  return (
    <div className="mx-auto mt-12 w-full max-w-[72ch]">
      <div role="log" aria-live="polite" aria-label="Interview transcript">
        {messages.length === 0 && (
          <p className="border-t border-shadow-ink/20 pt-6 text-lg text-shadow-ink">
            The subject is at the table, coffee in hand. Ask anything — the
            work, this site, the record player.
          </p>
        )}
        {messages.map((message) =>
          message.role === "user" ? (
            <p
              key={message.id}
              className="mt-10 border-t border-shadow-ink/20 pt-5 text-xs font-medium uppercase tracking-[0.08em] text-shadow-ink"
            >
              <span aria-hidden>Q — </span>
              {message.parts.find((p) => p.type === "text")?.text}
            </p>
          ) : (
            <Answer key={message.id} message={message} />
          )
        )}
        {busy && (
          <p aria-hidden className="mt-4 text-lg">
            <span className="interview-cursor">▮</span>
          </p>
        )}
        {error && (
          <p className="mt-6 border border-shadow-ink/20 p-4 text-shadow-ink">
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
          className="btn btn-letterpress rounded-[var(--radius-ticket)] bg-poppy px-6 py-3 text-sm font-medium uppercase tracking-[0.08em] text-white disabled:opacity-50"
        >
          {busy ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
