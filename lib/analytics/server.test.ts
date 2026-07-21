import { describe, expect, it } from "vitest";
import { visitorId } from "./server";

describe("visitorId", () => {
  it("prefers the browser's own PostHog ids", () => {
    const req = new Request("http://x/api/interview", {
      headers: { "x-ph-distinct-id": "d-1", "x-ph-session-id": "s-1" },
    });
    expect(visitorId(req)).toEqual({ distinctId: "d-1", sessionId: "s-1" });
  });

  it("falls back to a hashed IP, never the raw address", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    });
    const { distinctId } = visitorId(req);
    expect(distinctId).toMatch(/^anon_[0-9a-f]{24}$/);
    expect(distinctId).not.toContain("1.2.3.4");
  });

  it("gives the same IP the same pseudonym within a day", () => {
    const make = () =>
      new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4" } });
    expect(visitorId(make()).distinctId).toBe(visitorId(make()).distinctId);
  });
});
