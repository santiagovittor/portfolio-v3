/**
 * The event taxonomy. Every custom event on this site is named here, so the
 * PostHog dashboard never fills up with typo'd twins of the same event.
 *
 * Naming: object_verb, snake_case, past tense. Properties are snake_case too.
 * Pageviews, pageleaves, autocaptured clicks, rageclicks, web vitals and
 * session replay all come from posthog-js itself — nothing below duplicates
 * them.
 */
export const EVENTS = {
  /** A section of the long page scrolled into view (>=50% for >=1s). */
  sectionViewed: "section_viewed",
  /** A click on a link leaving the site. */
  outboundLinkClicked: "outbound_link_clicked",

  /** First question of a visit. Fires once per session, before the question. */
  interviewStarted: "interview_started",
  /** A question was sent to the chat. */
  interviewQuestionAsked: "interview_question_asked",
  /** An answer finished streaming. Carries latency, sources, cards. */
  interviewAnswerReceived: "interview_answer_received",
  /** The stream errored out (client-visible "the line dropped"). */
  interviewAnswerFailed: "interview_answer_failed",
  /** Visitor left while an answer was still streaming. */
  interviewAbandoned: "interview_abandoned",

  // ---- server side (lib/analytics/server.ts) ----
  /** A request reached the API route and passed validation. */
  interviewRequestReceived: "interview_request_received",
  /** Guard blocked the request (injection or rate limit). */
  interviewRefused: "interview_refused",
  /** RAG retrieval finished. What the corpus actually served. */
  interviewRetrieval: "interview_retrieval",
  /** Model or embedding provider failed. */
  interviewUpstreamFailed: "interview_upstream_failed",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/** Headers the browser uses to hand its cookieless identity to the server. */
export const ANALYTICS_HEADERS = {
  distinctId: "x-ph-distinct-id",
  sessionId: "x-ph-session-id",
} as const;
