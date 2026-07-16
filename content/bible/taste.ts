export type TasteCategory = "film" | "music" | "cooking" | "sports";

export const tastes: Record<
  TasteCategory,
  { title: string; items: { name: string; note: string }[] }
> = {
  film: {
    title: "On the Letterboxd top row",
    items: [
      { name: "Big Fish", note: "sentiment that earns it" },
      { name: "It's a Wonderful Life", note: "the permanent rewatch" },
    ],
  },
  music: {
    title: "On the record player",
    items: [
      { name: "Abbey Road — The Beatles", note: "the songwriting" },
      { name: "Making Movies — Dire Straits", note: "that guitar tone" },
    ],
  },
  cooking: {
    title: "From the kitchen",
    items: [{ name: "Italian, mostly", note: "pasta from scratch when there's time" }],
  },
  sports: {
    title: "Followed, seriously",
    items: [{ name: "(SV: confirm)", note: "the Argentine way" }],
  },
};
