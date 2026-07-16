// lib/interview/model.ts — the ONE place the model ids + provider live
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Same model santiagovittor-store uses; verified against installed @ai-sdk/google's GoogleModelId union.
export const chatModel = () => google("gemini-3.5-flash");
