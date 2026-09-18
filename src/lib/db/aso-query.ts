import { db } from "@/lib/db";

export type KeywordRank = {
  term: string;
  /** Today's position, 1 = top of the search results. */
  position: number;
  /** Positions gained since the start of the window; positive is an improvement. */
  change: number;
  volume: number | null;
  difficulty: number | null;
  /** Oldest to newest, for the sparkline. */
  history: number[];
};

type Row = Record<string, unknown>;

/**
 * Where an app currently sits for the terms it is tracked on.
 *
 * `change` is positive when the app climbed, which means position went *down*:
 * rank 4 from rank 11 is +7. Reporting the raw difference would show a rise as
 * a negative number, which is the opposite of what the arrow next to it means.
 */
export function keywordRanksForApp(appId: string, days = 30): KeywordRank[] {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const rows = db()
    .prepare(
      `SELECT k.term, k.volume, k.difficulty, r.position, r.day
       FROM keyword_ranks r
       JOIN keywords k ON k.id = r.keyword_id
       WHERE r.app_id = ? AND r.day >= ?
       ORDER BY k.term ASC, r.day ASC`,
    )
    .all(appId, since) as Row[];

  const byTerm = new Map<string, { volume: number | null; difficulty: number | null; points: number[] }>();
  for (const row of rows) {
    const term = row.term as string;
    const entry =
      byTerm.get(term) ??
      { volume: (row.volume as number) ?? null, difficulty: (row.difficulty as number) ?? null, points: [] };
    entry.points.push(row.position as number);
    byTerm.set(term, entry);
  }

  return [...byTerm.entries()]
    .map(([term, entry]) => {
      const first = entry.points[0];
      const current = entry.points[entry.points.length - 1];
      return {
        term,
        position: current,
        change: first - current,
        volume: entry.volume,
        difficulty: entry.difficulty,
        history: entry.points,
      };
    })
    .sort((a, b) => a.position - b.position);
}

export type CountrySplit = {
  country: string;
  downloads: number;
  revenue: number;
  share: number;
};

/** Where an app's installs and money come from, biggest market first. */
export function countriesForApp(appId: string): CountrySplit[] {
  const rows = db()
    .prepare(
      `SELECT country, downloads, revenue, share FROM app_countries
       WHERE app_id = ? ORDER BY share DESC`,
    )
    .all(appId) as Row[];

  return rows.map((row) => ({
    country: row.country as string,
    downloads: (row.downloads as number) ?? 0,
    revenue: (row.revenue as number) ?? 0,
    share: (row.share as number) ?? 0,
  }));
}

export type TermCompetitor = {
  appId: string;
  title: string;
  iconUrl: string | null;
  developer: string | null;
  position: number;
  change: number;
};

/**
 * Who actually ranks for a term today, by position — not who happens to mention
 * it in their description, which is what a text match answers.
 */
export function appsRankingFor(term: string, limit = 20): TermCompetitor[] {
  const latest = db()
    .prepare("SELECT MAX(day) AS day FROM keyword_ranks")
    .get() as { day: string | null };
  if (!latest.day) return [];

  const since = new Date(Date.parse(latest.day) - 30 * 86400000).toISOString().slice(0, 10);

  const rows = db()
    .prepare(
      `SELECT a.id, a.title, a.icon_url, a.developer, r.position,
              (SELECT p.position FROM keyword_ranks p
                WHERE p.keyword_id = r.keyword_id AND p.app_id = r.app_id AND p.day >= ?
                ORDER BY p.day ASC LIMIT 1) AS first_position
       FROM keyword_ranks r
       JOIN keywords k ON k.id = r.keyword_id
       JOIN apps a ON a.id = r.app_id
       WHERE k.term = ? AND r.day = ?
       ORDER BY r.position ASC
       LIMIT ?`,
    )
    .all(since, term.trim().toLowerCase(), latest.day, limit) as Row[];

  return rows.map((row) => ({
    appId: row.id as string,
    title: row.title as string,
    iconUrl: (row.icon_url as string) ?? null,
    developer: (row.developer as string) ?? null,
    position: row.position as number,
    change: ((row.first_position as number) ?? (row.position as number)) - (row.position as number),
  }));
}
