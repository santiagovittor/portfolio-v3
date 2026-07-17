// lib/interview/model.ts — the ONE place the model ids + provider live
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Embeddings only (gemini-embedding-001) — chat moved to NVIDIA, slice 6.
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const nvidia = createOpenAICompatible({
  name: "nvidia",
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY,
});

// Verified live 2026-07-17: ~2s, clean tool calls, Spanish OK — but ONLY with
// enable_thinking:false in the request body (see route.ts), else it streams
// its reasoning to the visitor.
export const chatModel = () => nvidia("nvidia/nemotron-3-super-120b-a12b");
