import { db } from "@/lib/db";
import { cached, invalidateCache } from "@/lib/db/cache";
import { rowToApp } from "@/lib/db/apps-repo";
import type { App } from "@/lib/types";

export type KeywordStats = {
  term: string;
  /** How many catalogue apps target the term in title or description. */
  competingApps: number;
  /** 0–100: how hard it looks to rank, from how strong the incumbents are. */
  difficulty: number;
  /** 0–100 proxy for demand, from the review volume of apps that rank for it. */
  volumeIndex: number;
  topApps: App[];
};

type Row = Record<string, unknown>;

const STOPWORDS = new Set([
  "the", "and", "for", "with", "your", "you", "app", "that", "this", "from", "are", "our",
  "its", "was", "has", "have", "make", "made", "without", "people", "helps", "them", "not",
  "all", "can", "get", "new", "now", "out", "how", "who", "why", "what", "when", "into",
]);

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Stores do not publish keyword volume, so both numbers here are proxies derived
 * from the catalogue: how crowded a term is, and how much review activity the apps
 * ranking for it carry. They compare terms against each other, nothing more.
 */
export function keywordStats(term: string, { limit = 10 }: { limit?: number } = {}): KeywordStats {
  const like = `%${term.trim()}%`;

  const competing = (
    db()
      .prepare("SELECT COUNT(*) AS n FROM apps WHERE title LIKE ? OR description LIKE ?")
      .get(like, like) as { n: number }
  ).n;

  const rows = db()
    .prepare(
      `SELECT * FROM apps
       WHERE title LIKE ? OR description LIKE ?
       ORDER BY (CASE WHEN title LIKE ? THEN 1 ELSE 0 END) DESC, rating_count DESC
       LIMIT ?`,
    )
    .all(like, like, like, limit) as Row[];

  const topApps = rows.map(rowToApp);
  const reviewMass = topApps.reduce((sum, app) => sum + (app.ratingCount ?? 0), 0);

  // Both scales are logarithmic: app stores are winner-take-most, so linear
  // numbers would put every term at the bottom of the range.
  const difficulty = clamp(Math.round((Math.log10(reviewMass + 1) / 7) * 100));
  const volumeIndex = clamp(Math.round((Math.log10(reviewMass + 1) / 6.5) * 100));

  return { term, competingApps: competing, difficulty, volumeIndex, topApps };
}

/**
 * Terms that appear across the catalogue, ranked by how often they show up in app
 * titles. Titles only: marketing copy is full of filler that reads as a keyword
 * but nobody searches for.
 */
export function suggestedKeywords(limit = 24): { term: string; count: number }[] {
  return cached(`suggestedKeywords:${limit}`, () => {
  const rows = db().prepare("SELECT title FROM apps").all() as Row[];
  const counts = new Map<string, number>();

  for (const row of rows) {
    const text = String(row.title ?? "").toLowerCase();
    for (const word of text.split(/[^a-z]+/)) {
      if (word.length < 4 || STOPWORDS.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  });
}

export function trackedApps(role?: "own" | "competitor") {
  const rows = role
    ? (db()
        .prepare(
          "SELECT a.*, t.role, t.added_at, t.note FROM tracked_apps t JOIN apps a ON a.id = t.app_id WHERE t.role = ? ORDER BY t.added_at DESC",
        )
        .all(role) as Row[])
    : (db()
        .prepare(
          "SELECT a.*, t.role, t.added_at, t.note FROM tracked_apps t JOIN apps a ON a.id = t.app_id ORDER BY t.added_at DESC",
        )
        .all() as Row[]);

  return rows.map((row) => ({
    app: rowToApp(row),
    role: row.role as "own" | "competitor",
    addedAt: row.added_at as string,
    note: (row.note as string) ?? null,
  }));
}

export function trackApp(appId: string, role: "own" | "competitor", note?: string) {
  invalidateCache();
  db()
    .prepare(
      "INSERT INTO tracked_apps (app_id, role, added_at, note) VALUES (?, ?, ?, ?) ON CONFLICT (app_id) DO UPDATE SET role = excluded.role, note = excluded.note",
    )
    .run(appId, role, new Date().toISOString(), note ?? null);
}

export function untrackApp(appId: string) {
  invalidateCache();
  db().prepare("DELETE FROM tracked_apps WHERE app_id = ?").run(appId);
}

export function searchAppsByName(term: string, limit = 12): App[] {
  const rows = db()
    .prepare("SELECT * FROM apps WHERE title LIKE ? ORDER BY rating_count DESC LIMIT ?")
    .all(`%${term}%`, limit) as Row[];
  return rows.map(rowToApp);
}
