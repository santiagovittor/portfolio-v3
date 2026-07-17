import { tool } from "ai";
import { z } from "zod";
import { getSnapshot } from "../spotify/api";

// Keep in sync with app/work/case-studies.ts slugs (checked in slice 5).
export const PROJECT_SLUGS = ["santiagovittor-store", "dubanronald", "canvass"] as const;

export const interviewTools = {
  show_project: tool({
    description:
      "Show one of Santiago's projects as an inline card. Use when a specific project answers the question better than prose. Follow with at most one sentence.",
    inputSchema: z.object({ slug: z.enum(PROJECT_SLUGS) }),
    execute: async ({ slug }) => ({ slug }),
  }),
  show_taste: tool({
    description:
      "Show a card of Santiago's tastes (film, music, cooking, sports). Use when the interviewer asks about them.",
    inputSchema: z.object({
      category: z.enum(["film", "music", "cooking", "sports"]),
    }),
    execute: async ({ category }) => ({ category }),
  }),
  now_spinning: tool({
    description:
      "Live look at what Santiago is listening to on Spotify right now and lately. Use for any question about current music, what he's playing, or listening habits. For long-standing taste use show_taste instead. Follow with at most two sentences that react to the actual tracks.",
    inputSchema: z.object({}),
    execute: async () => {
      const snap = await getSnapshot();
      return snap ?? { unavailable: true as const };
    },
  }),
  contact_card: tool({
    description:
      "Show Santiago's contact options. Use when the interviewer wants to hire, reach, or follow up with Santiago.",
    inputSchema: z.object({}),
    execute: async () => ({}),
  }),
};
