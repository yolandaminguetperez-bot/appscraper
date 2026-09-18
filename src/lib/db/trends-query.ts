import { db } from "@/lib/db";
import { rowToApp } from "@/lib/db/apps-repo";
import type { App } from "@/lib/types";

export type TrendRow = {
  app: App;
  /** Review growth over the window, as a share of where it started. */
  growth: number;
  gained: number;
  windowDays: number;
};

type Row = Record<string, unknown>;

/**
 * Momentum comes from review history: an app whose review count is climbing
 * fastest is the one gaining users fastest. Apps too small to be meaningful are
 * filtered out by `minReviews`.
 */
export function queryTrending({
  windowDays = 30,
  stores = [],
  categories = [],
  minReviews = 500,
  maxAgeDays,
  limit = 50,
  page = 1,
}: {
  windowDays?: number;
  stores?: string[];
  categories?: string[];
  minReviews?: number;
  maxAgeDays?: number;
  limit?: number;
  page?: number;
} = {}) {
  const since = new Date(Date.now() - windowDays * 86400000).toISOString().slice(0, 10);
  const conditions: string[] = ["a.rating_count >= ?"];
  const params: unknown[] = [since, minReviews];

  if (stores.length) {
    conditions.push(`a.store IN (${stores.map(() => "?").join(",")})`);
    params.push(...stores);
  }
  if (categories.length) {
    conditions.push(`a.category IN (${categories.map(() => "?").join(",")})`);
    params.push(...categories);
  }
  if (maxAgeDays !== undefined) {
    conditions.push("a.released_at >= ?");
    params.push(new Date(Date.now() - maxAgeDays * 86400000).toISOString());
  }

  const sql = `
    WITH bounds AS (
      SELECT app_id,
             MIN(rating_count) AS start_count,
             MAX(rating_count) AS end_count
      FROM app_metrics
      WHERE day >= ?
      GROUP BY app_id
    )
    SELECT a.*,
           (b.end_count - b.start_count) AS gained,
           CASE WHEN b.start_count > 0
                THEN (CAST(b.end_count - b.start_count AS REAL) / b.start_count)
                ELSE 0 END AS growth
    FROM bounds b
    JOIN apps a ON a.id = b.app_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY growth DESC, gained DESC
    LIMIT ? OFFSET ?
  `;

  const rows = db()
    .prepare(sql)
    .all(...params, limit, (page - 1) * limit) as Row[];

  return rows.map<TrendRow>((row) => ({
    app: rowToApp(row),
    growth: (row.growth as number) ?? 0,
    gained: (row.gained as number) ?? 0,
    windowDays,
  }));
}

/** Rising = young apps that are already picking up reviews. */
export function queryRising(options: Parameters<typeof queryTrending>[0] = {}) {
  return queryTrending({ maxAgeDays: 120, minReviews: 50, windowDays: 30, ...options });
}

export type RankingRow = { position: number; app: App };

export function queryRankings({
  store = "ios",
  chart = "free",
  country = "us",
  category = "all",
  limit = 50,
}: {
  store?: string;
  chart?: string;
  country?: string;
  category?: string;
  limit?: number;
} = {}): RankingRow[] {
  const day = db()
    .prepare("SELECT MAX(day) AS day FROM rankings WHERE store = ? AND chart = ? AND country = ?")
    .get(store, chart, country) as { day: string | null };

  if (!day.day) return [];

  const rows = db()
    .prepare(
      `SELECT r.position, a.*
       FROM rankings r JOIN apps a ON a.id = r.app_id
       WHERE r.store = ? AND r.chart = ? AND r.country = ? AND r.category = ? AND r.day = ?
       ORDER BY r.position ASC
       LIMIT ?`,
    )
    .all(store, chart, country, category, day.day, limit) as Row[];

  return rows.map((row) => ({ position: row.position as number, app: rowToApp(row) }));
}

export function rankingCountries(): string[] {
  const rows = db().prepare("SELECT DISTINCT country FROM rankings ORDER BY country").all() as {
    country: string;
  }[];
  return rows.map((r) => r.country);
}

/**
 * Chart position history. Values are inverted (a lower rank is a better one), so
 * the plotted line rises when the app climbs — the direction readers expect.
 */
export function rankHistory(ids: string[], days = 30): Map<string, number[]> {
  const series = new Map<string, number[]>();
  if (ids.length === 0) return series;

  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const rows = db()
    .prepare(
      `SELECT app_id, rank FROM app_metrics
       WHERE day >= ? AND rank IS NOT NULL AND app_id IN (${ids.map(() => "?").join(",")})
       ORDER BY app_id, day ASC`,
    )
    .all(since, ...ids) as { app_id: string; rank: number }[];

  for (const row of rows) {
    const list = series.get(row.app_id) ?? [];
    list.push(Math.max(0, 400 - row.rank));
    series.set(row.app_id, list);
  }

  return series;
}
