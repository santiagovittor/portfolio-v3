// lib/interview/retrieval.ts — runtime retrieval for the Interview chat route.
import { embed } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import index from "../../data/interview-index.json";
import { topK, type IndexedChunk, type RetrievedChunk } from "./similarity";

type InterviewIndex = {
  bibleHash: string;
  model: string;
  dimensions: number;
  persona: string;
  chunks: IndexedChunk[];
};

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export function getIndex(): InterviewIndex {
  return index as InterviewIndex;
}

export async function retrieve(query: string): Promise<RetrievedChunk[]> {
  const { embedding } = await embed({
    model: google.embedding(getIndex().model),
    value: query,
    providerOptions: {
      google: { taskType: "RETRIEVAL_QUERY", outputDimensionality: getIndex().dimensions },
    },
  });
  return topK(embedding, getIndex().chunks);
}
