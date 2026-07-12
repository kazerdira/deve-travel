// Naive in-memory rate limiter (per process). Good enough for a small marketing site.
export function createLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { n: number; t: number }>();
  return function limited(key: string): boolean {
    const now = Date.now();
    const rec = hits.get(key);
    if (!rec || now - rec.t > windowMs) { hits.set(key, { n: 1, t: now }); return false; }
    rec.n += 1;
    return rec.n > max;
  };
}
