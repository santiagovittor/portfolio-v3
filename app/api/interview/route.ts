// app/api/interview/route.ts
import {
  convertToModelMessages, createUIMessageStream,
  createUIMessageStreamResponse, stepCountIs, streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";
import {
  createRateLimiter, detectLanguage, isOffTheRecord,
  looksLikeInjection, trimWindow,
} from "@/lib/interview/guards";
import { buildSystemPrompt } from "@/lib/interview/prompt";
import { getIndex, retrieve } from "@/lib/interview/retrieval";
import { interviewTools } from "@/lib/interview/tools";
import { chatModel } from "@/lib/interview/model";

export const maxDuration = 30;

const bodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      parts: z.array(z.object({ type: z.string() }).passthrough()),
    }).passthrough()
  ).min(1).max(20),
});

const perMinute = createRateLimiter(5, 60_000);
const perHour = createRateLimiter(20, 3_600_000);

const REFUSALS = {
  injection: {
    en: "Nice try. This is an interview about Santiago — ask me about the work.",
    es: "Buen intento. Esta es una entrevista sobre Santiago: preguntame por el trabajo.",
  },
  rate: {
    en: "You've filed too many questions this hour. The subject needs a coffee.",
    es: "Ya hiciste demasiadas preguntas por esta hora. El entrevistado necesita un café.",
  },
} as const;

// Refusals never reach the model, but slice 3 always expects finish
// metadata in the shape { sources, offTheRecord } — so refusal streams
// carry the same (empty) shape via an explicit message-metadata part.
function refusalStream(text: string) {
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: "text-start", id: "refusal" });
      writer.write({ type: "text-delta", id: "refusal", delta: text });
      writer.write({ type: "text-end", id: "refusal" });
      writer.write({
        type: "message-metadata",
        messageMetadata: { sources: [], offTheRecord: false },
      });
    },
  });
  return createUIMessageStreamResponse({ stream });
}

function userTexts(messages: UIMessage[]): string[] {
  return messages
    .filter((m) => m.role === "user")
    .map((m) =>
      m.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(" ")
    );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "malformed JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  const messages = parsed.data.messages as unknown as UIMessage[];

  const texts = userTexts(messages);
  if (texts.length === 0) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  const lastUserText = (texts.at(-1) ?? "").slice(0, 500);
  const language = detectLanguage(texts[0] ?? "");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!perMinute(ip) || !perHour(ip)) return refusalStream(REFUSALS.rate[language]);
  if (looksLikeInjection(lastUserText)) return refusalStream(REFUSALS.injection[language]);

  const offTheRecord = isOffTheRecord(texts);
  const chunks = await retrieve(lastUserText);
  const sources = [...new Set(chunks.map((c) => c.source))].map((label) => ({ label }));

  const windowed = trimWindow(messages);
  const truncatedWindowed = windowed.map((m, i) =>
    i === windowed.length - 1 && m.role === "user"
      ? { ...m, parts: [{ type: "text" as const, text: lastUserText }] }
      : m
  );

  const result = streamText({
    model: chatModel(),
    system: buildSystemPrompt({
      persona: getIndex().persona,
      chunks,
      language,
      offTheRecord,
    }),
    messages: await convertToModelMessages(truncatedWindowed),
    tools: interviewTools,
    stopWhen: stepCountIs(4),
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) =>
      part.type === "finish" ? { sources, offTheRecord } : undefined,
  });
}
