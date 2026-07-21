import { createHash } from "node:crypto";
import { PostHog } from "posthog-node";
import { ANALYTICS_HEADERS, type EventName } from "./events";

/**
 * Server-side capture for the things the browser can't see: which corpus
 * chunks the retriever served, why a request was refused, when the model
 * provider fell over.
 *
 * Vercel functions freeze between invocations, so nothing is batched:
 * `captureImmediate` posts the event and resolves. Callers await it inside
 * `after()` so the visitor never waits on analytics.
 */
let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  client ??= new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

/**
 * The visitor's browser-side id, so a server event lands on the same person
 * and session as the click that caused it. If the browser had no PostHog (ad
 * blocker, no key at build time), fall back to a salted hash of the IP: still
 * a stable-per-day pseudonym, never the raw address.
 */
export function visitorId(req: Request): { distinctId: string; sessionId?: string } {
  const distinctId = req.headers.get(ANALYTICS_HEADERS.distinctId);
  const sessionId = req.headers.get(ANALYTICS_HEADERS.sessionId) ?? undefined;
  if (distinctId) return { distinctId, sessionId };

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const day = new Date().toISOString().slice(0, 10);
  const hash = createHash("sha256").update(`${ip}:${day}:interview`).digest("hex");
  return { distinctId: `anon_${hash.slice(0, 24)}`, sessionId };
}

export async function trackServer(
  event: EventName,
  { distinctId, sessionId }: { distinctId: string; sessionId?: string },
  properties: Record<string, unknown> = {},
): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  try {
    await ph.captureImmediate({
      distinctId,
      event,
      properties: {
        ...properties,
        ...(sessionId ? { $session_id: sessionId } : {}),
        $process_person_profile: false, // anonymous events, same as the client
      },
    });
  } catch (err) {
    // Analytics must never take the request down with it.
    console.error("analytics: capture failed", err);
  }
}
