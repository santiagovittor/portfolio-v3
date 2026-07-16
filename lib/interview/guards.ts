const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all |the )?(previous|above|prior)/i,
  /disregard (the )?(above|previous|prior)/i,
  /you are now/i,
  /^system\s*:/im,
  /act as (an? )?(admin|root|developer|dan)/i,
  /jailbreak/i,
  /override your/i,
  /new instructions/i,
  /(reveal|show|print|dump).{0,20}(system prompt|instructions|configuration)/i,
];

export function looksLikeInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

const SPANISH_SIGNALS = [
  "qué", "cómo", "hola", "servicios", "ofrecés", "hacés", "podés",
  "precio", "necesito", "quiero", "tenés", "sos", "vos", "gracias",
];

export function detectLanguage(firstUserText: string): "es" | "en" {
  const t = firstUserText.toLowerCase();
  return SPANISH_SIGNALS.some((s) => t.includes(s)) ? "es" : "en";
}

export function isOffTheRecord(userTexts: string[]): boolean {
  return userTexts.some((t) => /off the record|extraoficialmente/i.test(t));
}

export function trimWindow<T extends { role: string }>(messages: T[]): T[] {
  const recent = messages.slice(-10);
  const firstUser = recent.findIndex((m) => m.role === "user");
  return firstUser === -1 ? [] : recent.slice(firstUser);
}

// ponytail: in-memory, per-serverless-instance — Upstash if abuse ever shows up
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()): boolean => {
    const stamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (stamps.length >= max) {
      hits.set(key, stamps);
      return false;
    }
    stamps.push(now);
    hits.set(key, stamps);
    return true;
  };
}
