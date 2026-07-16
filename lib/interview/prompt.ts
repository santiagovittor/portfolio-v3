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
    "- Use the show_project tool when a specific project would answer better than prose; show_taste for film/music/cooking/sports; contact_card when the interviewer wants to reach Santiago.",
  ].join("\n\n");
}
