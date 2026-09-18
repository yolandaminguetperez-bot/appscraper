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

export type RelatedKeyword = {
  term: string;
  /** Apps that mention BOTH terms. */
  apps: number;
  /** Difficulty of the pair, on the same 0-100 scale as keywordStats. */
  difficulty: number;
};

/**
 * Terms that show up in the titles of the apps already ranking for `term`.
 *
 * Scored inside that subset on purpose: running a fresh catalogue-wide LIKE per
 * candidate would be a dozen full scans to answer a question nobody asked. What
 * this answers is narrower and more useful — "of the apps competing here, what
 * else do they call themselves, and is that corner easier?"
 */
export function relatedKeywords(term: string, limit = 8): RelatedKeyword[] {
  const like = `%${term.trim()}%`;
  const rows = db()
    .prepare("SELECT title, rating_count FROM apps WHERE title LIKE ? OR description LIKE ?")
    .all(like, like) as Row[];

  const needle = term.trim().toLowerCase();
  const counts = new Map<string, { apps: number; reviews: number }>();

  for (const row of rows) {
    const reviews = Number(row.rating_count ?? 0);
    const words = new Set(
      String(row.title ?? "")
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((word) => word.length >= 4 && !STOPWORDS.has(word) && !needle.includes(word)),
    );
    for (const word of words) {
      const entry = counts.get(word) ?? { apps: 0, reviews: 0 };
      entry.apps += 1;
      entry.reviews += reviews;
      counts.set(word, entry);
    }
  }

  return [...counts.entries()]
    .filter(([, entry]) => entry.apps > 1)
    .sort((a, b) => b[1].apps - a[1].apps)
    .slice(0, limit)
    .map(([word, entry]) => ({
      term: word,
      apps: entry.apps,
      difficulty: clamp(Math.round((Math.log10(entry.reviews + 1) / 7) * 100)),
    }));
}

/**
 * A term's crowding without pulling the ranking apps: enough for a row in a
 * list of candidates. Cached because a page typically asks for several at once
 * and each one is a LIKE scan.
 */
export function keywordSnapshot(term: string): RelatedKeyword {
  const trimmed = term.trim().toLowerCase();
  return cached(`keywordSnapshot:${trimmed}`, () => {
    const like = `%${trimmed}%`;
    const row = db()
      .prepare(
        `SELECT COUNT(*) AS n, COALESCE(SUM(rating_count), 0) AS reviews
         FROM apps WHERE title LIKE ? OR description LIKE ?`,
      )
      .get(like, like) as { n: number; reviews: number };

    return {
      term: trimmed,
      apps: row.n,
      difficulty: clamp(Math.round((Math.log10(row.reviews + 1) / 7) * 100)),
    };
  });
}

/**
 * The searchable words an app already puts in its own title. Three letters is
 * the floor here, not four as in the catalogue-wide suggestions: "vpn", "pay"
 * and "lab" are real terms, and a title is short enough that the noise a lower
 * floor lets through elsewhere does not arise.
 */
export function titleKeywords(title: string, limit = 5): RelatedKeyword[] {
  const words = [
    ...new Set(
      title
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((word) => word.length >= 3 && !STOPWORDS.has(word)),
    ),
  ].slice(0, limit);

  return words.map(keywordSnapshot).sort((a, b) => b.difficulty - a.difficulty);
}

/** Turns the 0-100 score into the word someone would actually use. */
export function difficultyBand(score: number): string {
  if (score >= 75) return "Brutal";
  if (score >= 55) return "Hard";
  if (score >= 35) return "Moderate";
  return "Open";
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
