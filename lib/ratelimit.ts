const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

/**
 * Fixed window, in process.
 *
 * ponytail: in-memory, so it resets on deploy and counts per instance. That is
 * honest for one container; put it in Redis (or an App Runner request limit) the
 * day this runs on more than one.
 */
export function allow(key: string, now: () => number = Date.now): boolean {
  const t = now();
  const recent = (hits.get(key) ?? []).filter((at) => t - at < WINDOW_MS);

  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }

  recent.push(t);
  hits.set(key, recent);

  // Keep the map from growing without bound on a long-lived process.
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.every((at) => t - at >= WINDOW_MS)) hits.delete(k);
  }
  return true;
}

/** The caller's address, as far as we can tell behind a proxy. */
export const callerKey = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip") ||
  "unknown";

/** Tests only. */
export const _reset = () => hits.clear();
