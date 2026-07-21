import posthog from "posthog-js";
import { ANALYTICS_HEADERS, type EventName } from "./events";

/**
 * Capture that no-ops cleanly when PostHog never initialised (no key in the
 * environment, or the script was blocked). Components call this, never
 * posthog.capture directly, so a missing key can't throw in the middle of the
 * chat.
 */
export function track(event: EventName, properties?: Record<string, unknown>) {
  if (!posthog.__loaded) return;
  posthog.capture(event, properties);
}

/**
 * The current cookieless identity, as headers, so a fetch the browser makes
 * can be stitched to the same person and session server side.
 */
export function analyticsHeaders(): Record<string, string> {
  if (!posthog.__loaded) return {};
  const headers: Record<string, string> = {};
  const distinctId = posthog.get_distinct_id();
  const sessionId = posthog.get_session_id();
  if (distinctId) headers[ANALYTICS_HEADERS.distinctId] = distinctId;
  if (sessionId) headers[ANALYTICS_HEADERS.sessionId] = sessionId;
  return headers;
}
