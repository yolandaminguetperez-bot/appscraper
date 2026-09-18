import { db } from "@/lib/db";
import { cached } from "@/lib/db/cache";
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
export function queryTrending(options: {
  windowDays?: number;
  stores?: string[];
  categories?: string[];
  minReviews?: number;
  maxAgeDays?: number;
  limit?: number;
  page?: number;
} = {}) {
  // Catalogue-wide and identical for every visitor, so it is memoised: measured
  // at 25k apps it was 138ms of the trending page's 155ms, repeated per request.
  return cached(`trending:${JSON.stringify(options)}`, () => computeTrending(options));
}

function computeTrending({
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
  const params: unknown[] = [minReviews];

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

  // The window's first and last stored day. Everything between them is noise for
  // a growth figure, and scanning it dominated the query at catalogue scale.
  const bounds = db()
    .prepare("SELECT MIN(day) AS first, MAX(day) AS last FROM app_metrics WHERE day >= ?")
    .get(since) as { first: string | null; last: string | null };

  if (!bounds.first || !bounds.last || bounds.first === bounds.last) return [];

  const sql = `
    SELECT a.*,
           (e.rating_count - s.rating_count) AS gained,
           CASE WHEN s.rating_count > 0
                THEN (CAST(e.rating_count - s.rating_count AS REAL) / s.rating_count)
                ELSE 0 END AS growth
    FROM app_metrics s
    JOIN app_metrics e ON e.app_id = s.app_id AND e.day = ?
    JOIN apps a ON a.id = s.app_id
    WHERE s.day = ? AND ${conditions.join(" AND ")}
    ORDER BY growth DESC, gained DESC
    LIMIT ? OFFSET ?
  `;

  const rows = db()
    .prepare(sql)
    .all(bounds.last, bounds.first, ...params, limit, (page - 1) * limit) as Row[];

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

export type ChartMove = {
  app: App;
  position: number;
  /** Places gained since the comparison day; positive is a climb. */
  change: number | null;
  /** True when the app was not on the chart on the comparison day. */
  entered: boolean;
};

export type ChartMovement = {
  day: string;
  comparedTo: string;
  climbers: ChartMove[];
  fallers: ChartMove[];
  entries: ChartMove[];
  exits: { app: App; previousPosition: number }[];
};

/**
 * What changed in a top chart since `days` ago.
 *
 * A chart read once tells you who is #3; read twice it tells you who is moving,
 * which is the part worth acting on. Climbs are signed so that up is positive,
 * against a position number that falls as an app rises.
 */
export function chartMovement({
  store = "ios",
  chart = "free",
  country = "us",
  days = 7,
  limit = 5,
}: {
  store?: string;
  chart?: string;
  country?: string;
  days?: number;
  limit?: number;
} = {}): ChartMovement | null {
  return cached(`chartMovement:${store}:${chart}:${country}:${days}:${limit}`, () => {
    const day = (
      db()
        .prepare("SELECT MAX(day) AS day FROM rankings WHERE store = ? AND chart = ? AND country = ?")
        .get(store, chart, country) as { day: string | null }
    ).day;
    if (!day) return null;

    // The nearest stored day at or before the target, so a gap in collection
    // compares against real data instead of returning nothing.
    const target = new Date(Date.parse(day) - days * 86400000).toISOString().slice(0, 10);
    const comparedTo = (
      db()
        .prepare(
          `SELECT MAX(day) AS day FROM rankings
           WHERE store = ? AND chart = ? AND country = ? AND day <= ?`,
        )
        .get(store, chart, country, target) as { day: string | null }
    ).day;

    if (!comparedTo || comparedTo === day) return null;

    const rows = db()
      .prepare(
        `SELECT a.*, now.position AS position, before.position AS previous
         FROM rankings now
         JOIN apps a ON a.id = now.app_id
         LEFT JOIN rankings before
           ON before.app_id = now.app_id AND before.store = now.store
          AND before.chart = now.chart AND before.country = now.country AND before.day = ?
         WHERE now.store = ? AND now.chart = ? AND now.country = ? AND now.day = ?`,
      )
      .all(comparedTo, store, chart, country, day) as Row[];

    const moves: ChartMove[] = rows.map((row) => {
      const position = row.position as number;
      const previous = (row.previous as number) ?? null;
      return {
        app: rowToApp(row),
        position,
        change: previous === null ? null : previous - position,
        entered: previous === null,
      };
    });

    const gone = db()
      .prepare(
        `SELECT a.*, before.position AS previous
         FROM rankings before
         JOIN apps a ON a.id = before.app_id
         WHERE before.store = ? AND before.chart = ? AND before.country = ? AND before.day = ?
           AND NOT EXISTS (
             SELECT 1 FROM rankings now
             WHERE now.app_id = before.app_id AND now.store = before.store
               AND now.chart = before.chart AND now.country = before.country AND now.day = ?
           )
         ORDER BY before.position ASC
         LIMIT ?`,
      )
      .all(store, chart, country, comparedTo, day, limit) as Row[];

    const ranked = moves.filter((move) => move.change !== null);

    return {
      day,
      comparedTo,
      climbers: [...ranked].sort((a, b) => (b.change ?? 0) - (a.change ?? 0)).slice(0, limit),
      fallers: [...ranked].sort((a, b) => (a.change ?? 0) - (b.change ?? 0)).slice(0, limit),
      entries: moves.filter((move) => move.entered).sort((a, b) => a.position - b.position).slice(0, limit),
      exits: gone.map((row) => ({ app: rowToApp(row), previousPosition: row.previous as number })),
    };
  });
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

export type CountrySummary = {
  country: string;
  apps: number;
  combinedMrr: number;
  /** How many of this country's top 50 also chart in the country being viewed. */
  sharedWithCurrent: number;
  leader: { id: string; title: string; iconUrl: string | null } | null;
};

/**
 * Per-country roll-up of the current chart.
 *
 * The comparison metric is overlap with the country you are looking at, not
 * combined revenue: revenue sums converge across countries and every bar ends up
 * full, which compares nothing. Overlap actually differs, and answers the
 * question the strip exists for — is this market the same as mine?
 */
export function rankingsByCountry({
  store = "ios",
  chart = "free",
  current = "us",
}: { store?: string; chart?: string; current?: string } = {}): CountrySummary[] {
  const day = (
    db()
      .prepare("SELECT MAX(day) AS day FROM rankings WHERE store = ? AND chart = ?")
      .get(store, chart) as { day: string | null }
  ).day;

  if (!day) return [];

  const rows = db()
    .prepare(
      `SELECT r.country,
              COUNT(*) AS apps,
              COALESCE(SUM(a.est_mrr), 0) AS combined_mrr,
              SUM(CASE WHEN EXISTS (
                SELECT 1 FROM rankings cur
                WHERE cur.store = r.store AND cur.chart = r.chart AND cur.day = r.day
                  AND cur.country = ? AND cur.app_id = r.app_id
              ) THEN 1 ELSE 0 END) AS shared
       FROM rankings r JOIN apps a ON a.id = r.app_id
       WHERE r.store = ? AND r.chart = ? AND r.day = ?
       GROUP BY r.country
       ORDER BY shared DESC, r.country ASC`,
    )
    .all(current, store, chart, day) as {
    country: string;
    apps: number;
    combined_mrr: number;
    shared: number;
  }[];

  const leaderStmt = db().prepare(
    `SELECT a.id, a.title, a.icon_url FROM rankings r JOIN apps a ON a.id = r.app_id
     WHERE r.store = ? AND r.chart = ? AND r.day = ? AND r.country = ? AND r.position = 1`,
  );

  return rows.map((row) => {
    const leader = leaderStmt.get(store, chart, day, row.country) as
      | { id: string; title: string; icon_url: string | null }
      | undefined;

    return {
      country: row.country,
      apps: row.apps,
      combinedMrr: row.combined_mrr,
      sharedWithCurrent: row.shared ?? 0,
      leader: leader ? { id: leader.id, title: leader.title, iconUrl: leader.icon_url } : null,
    };
  });
}
