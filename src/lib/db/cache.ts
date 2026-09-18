/**
 * Memo for catalogue-wide aggregates.
 *
 * better-sqlite3 is synchronous, so a 300ms aggregate does not just make one
 * request slow — it blocks the event loop and every other request queues behind
 * it. The views that run these aggregates render the same figures for everyone,
 * so recomputing them per request is pure contention.
 *
 * Entries are dropped whenever anything writes, so a refresh or a favourite is
 * never served stale; the TTL only bounds staleness from writes we do not see
 * (another process touching the same file).
 */
const DEFAULT_TTL_MS = 30_000;

type Entry = { value: unknown; expires: number; version: number };

const entries = new Map<string, Entry>();
let version = 0;

export function invalidateCache(): void {
  version += 1;
  entries.clear();
}

export function cached<T>(key: string, compute: () => T, ttlMs = DEFAULT_TTL_MS): T {
  const hit = entries.get(key);
  if (hit && hit.version === version && hit.expires > Date.now()) {
    return hit.value as T;
  }

  const value = compute();
  entries.set(key, { value, expires: Date.now() + ttlMs, version });
  return value;
}

export function cacheStats() {
  return { entries: entries.size, version };
}
