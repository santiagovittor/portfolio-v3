// Mock data + mock stream for Slice 1 — The Exchange.
// Everything the real backend will replace lives in this file.

export const STAGE_DIRECTIONS = [
  "(Santiago considers. Stirs his coffee.)",
  "(He glances at the record player.)",
  "(A long pause. He turns the question over.)",
  "(He reaches for a notebook, thinks better of it.)",
];

export type MockAnswer = { topic: string; text: string };

export const MOCK_ANSWERS: MockAnswer[] = [
  {
    topic: "on FoodStyles",
    text: "FoodStyles was the first product where I owned a flow end to end. I rebuilt the onboarding screens twice — the first version tested well in the room and badly in the wild, which taught me to trust session recordings over compliments. The second version cut drop-off by a third. Since then I design for the recording, not the demo.",
  },
  {
    topic: "on shipping",
    text: "I ship small and often. A feature that lands in three quiet pieces beats one dramatic release — you find out sooner what's wrong, and nothing rots on a branch. This site works the same way: every section went live the day it was finished, imperfect and observable.",
  },
  {
    topic: "on Buenos Aires",
    text: "Buenos Aires keeps me honest about craft. The city runs on things that were built well once and maintained forever — cafés, presses, bookstores. I work remote for teams in other time zones; the overlap hours are for people, the quiet mornings are where the hard problems get solved.",
  },
];

/** How long the stage-direction "thinking" state holds before words arrive. */
export const THINKING_MS = 1800;

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Streams an answer as 1–3 word chunks, 60–140ms apart — the same shape a
 * token stream arrives in, so the real wiring swaps in without touching the
 * component (see README → Wiring the real model).
 */
export async function* streamAnswer(text: string): AsyncGenerator<string> {
  const words = text.split(" ");
  let i = 0;
  while (i < words.length) {
    const n = 1 + Math.floor(Math.random() * 3);
    yield words.slice(i, i + n).join(" ");
    i += n;
    await delay(60 + Math.random() * 80);
  }
}
