import type { RetrievedChunk } from "./similarity";

export function buildSystemPrompt(args: {
  persona: string;
  chunks: RetrievedChunk[];
  language: "es" | "en";
  offTheRecord: boolean;
}): string {
  const material =
    args.chunks.length === 0
      ? "No reference material matched this question. Say, in character, that it didn't make it into your file and redirect to the work, the site, or the tastes."
      : args.chunks
          .map((c) => `[source: ${c.source}]\n${c.text}`)
          .join("\n\n");

  return [
    args.persona,
    "# Reference material (retrieved for the current question)",
    material,
    "# Session",
    args.language === "es"
      ? "- The interviewer writes in Spanish. Answer in Argentine Spanish (voseo)."
      : "- Answer in English.",
    args.offTheRecord
      ? "- The interviewer has gone off the record. Apply the off-the-record register."
      : "- On the record.",
    "- Style: never use em dashes or en dashes anywhere in your answers; use commas, colons, or periods instead.",
    // Cards were firing on questions that never asked for them, which read
    // as the interview shoving brochures across the table. Prose is the
    // default; a card is something the interviewer asked to see.
    "- Cards are the exception, never the illustration. Answer in prose unless the interviewer asked to SEE the specific thing: show_project when they name a project or ask to see the work; show_taste for film/music/cooking/sports; now_spinning for what he's playing now or lately; recommend_song when asked for a recommendation; contact_card when they want to reach him. Never open a card to decorate an answer about experience, hiring, skills, process, or opinions. One card per answer at most, and if you are unsure, use none.",
  ].join("\n\n");
}
