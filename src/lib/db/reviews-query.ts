import { db } from "@/lib/db";
import { rowToApp } from "@/lib/db/apps-repo";
import type { App } from "@/lib/types";

type Row = Record<string, unknown>;

export type ReviewRow = {
  id: string;
  appId: string;
  appTitle: string;
  author: string | null;
  rating: number | null;
  title: string | null;
  body: string | null;
  postedAt: string | null;
  sentiment: string | null;
  topics: string[];
};

export type ReviewSummary = {
  total: number;
  average: number;
  distribution: { stars: number; count: number }[];
  sentiment: { positive: number; neutral: number; negative: number };
  topics: { topic: string; count: number; negativeShare: number }[];
};

export type ReviewFilters = {
  appId?: string;
  q?: string;
  ratings?: number[];
  sentiments?: string[];
  topics?: string[];
  windowDays?: number;
  page?: number;
  perPage?: number;
};

function buildWhere(f: ReviewFilters) {
  const sql: string[] = ["1 = 1"];
  const params: unknown[] = [];

  if (f.appId) {
    sql.push("r.app_id = ?");
    params.push(f.appId);
  }
  if (f.q) {
    sql.push("(r.body LIKE ? OR r.title LIKE ? OR a.title LIKE ?)");
    params.push(`%${f.q}%`, `%${f.q}%`, `%${f.q}%`);
  }
  if (f.ratings?.length) {
    sql.push(`r.rating IN (${f.ratings.map(() => "?").join(",")})`);
    params.push(...f.ratings);
  }
  if (f.sentiments?.length) {
    sql.push(`r.sentiment IN (${f.sentiments.map(() => "?").join(",")})`);
    params.push(...f.sentiments);
  }
  if (f.topics?.length) {
    sql.push(`(${f.topics.map(() => "r.topics_json LIKE ?").join(" OR ")})`);
    params.push(...f.topics.map((t) => `%"${t}"%`));
  }
  if (f.windowDays) {
    sql.push("r.posted_at >= ?");
    params.push(new Date(Date.now() - f.windowDays * 86400000).toISOString());
  }

  return { sql: `WHERE ${sql.join(" AND ")}`, params };
}

function parseTopics(value: unknown): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function queryReviews(f: ReviewFilters = {}) {
  const where = buildWhere(f);
  const perPage = Math.min(Math.max(f.perPage ?? 25, 1), 100);
  const page = Math.max(f.page ?? 1, 1);

  const total = (
    db()
      .prepare(`SELECT COUNT(*) AS n FROM reviews r JOIN apps a ON a.id = r.app_id ${where.sql}`)
      .get(...where.params) as { n: number }
  ).n;

  const rows = db()
    .prepare(
      `SELECT r.*, a.title AS app_title FROM reviews r JOIN apps a ON a.id = r.app_id ${where.sql}
       ORDER BY r.posted_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...where.params, perPage, (page - 1) * perPage) as Row[];

  const reviews = rows.map<ReviewRow>((row) => ({
    id: row.id as string,
    appId: row.app_id as string,
    appTitle: row.app_title as string,
    author: (row.author as string) ?? null,
    rating: (row.rating as number) ?? null,
    title: (row.title as string) ?? null,
    body: (row.body as string) ?? null,
    postedAt: (row.posted_at as string) ?? null,
    sentiment: (row.sentiment as string) ?? null,
    topics: parseTopics(row.topics_json),
  }));

  return { reviews, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export function summarizeReviews(f: ReviewFilters = {}): ReviewSummary {
  const where = buildWhere(f);

  const distRows = db()
    .prepare(
      `SELECT r.rating AS stars, COUNT(*) AS count FROM reviews r JOIN apps a ON a.id = r.app_id
       ${where.sql} GROUP BY r.rating`,
    )
    .all(...where.params) as { stars: number; count: number }[];

  const byStars = new Map(distRows.map((r) => [r.stars, r.count]));
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: byStars.get(stars) ?? 0 }));
  const total = distribution.reduce((sum, row) => sum + row.count, 0);
  const average = total
    ? distribution.reduce((sum, row) => sum + row.stars * row.count, 0) / total
    : 0;

  const sentimentRows = db()
    .prepare(
      `SELECT r.sentiment, COUNT(*) AS count FROM reviews r JOIN apps a ON a.id = r.app_id
       ${where.sql} GROUP BY r.sentiment`,
    )
    .all(...where.params) as { sentiment: string; count: number }[];

  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  for (const row of sentimentRows) {
    if (row.sentiment in sentiment) sentiment[row.sentiment as keyof typeof sentiment] = row.count;
  }

  // Topics live in a JSON column, so aggregate them in JS over the matching rows.
  const topicRows = db()
    .prepare(
      `SELECT r.topics_json, r.sentiment FROM reviews r JOIN apps a ON a.id = r.app_id ${where.sql}`,
    )
    .all(...where.params) as Row[];

  const counts = new Map<string, { count: number; negative: number }>();
  for (const row of topicRows) {
    for (const topic of parseTopics(row.topics_json)) {
      const entry = counts.get(topic) ?? { count: 0, negative: 0 };
      entry.count += 1;
      if (row.sentiment === "negative") entry.negative += 1;
      counts.set(topic, entry);
    }
  }

  const topics = [...counts.entries()]
    .map(([topic, entry]) => ({
      topic,
      count: entry.count,
      negativeShare: entry.count ? entry.negative / entry.count : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return { total, average, distribution, sentiment, topics };
}

export function appsWithReviews(limit = 200): App[] {
  const rows = db()
    .prepare(
      `SELECT a.* FROM apps a
       WHERE EXISTS (SELECT 1 FROM reviews r WHERE r.app_id = a.id)
       ORDER BY a.rating_count DESC LIMIT ?`,
    )
    .all(limit) as Row[];
  return rows.map(rowToApp);
}

/** Average rating per week for the current filter, for the trend chart. */
export function ratingOverTime(f: ReviewFilters = {}): { day: string; value: number }[] {
  const where = buildWhere(f);

  const rows = db()
    .prepare(
      `SELECT substr(r.posted_at, 1, 10) AS day, AVG(r.rating) AS avg_rating
       FROM reviews r JOIN apps a ON a.id = r.app_id
       ${where.sql}
       GROUP BY substr(r.posted_at, 1, 7)
       ORDER BY day ASC`,
    )
    .all(...where.params) as { day: string; avg_rating: number }[];

  return rows
    .filter((row) => row.day && Number.isFinite(row.avg_rating))
    .map((row) => ({ day: row.day, value: Number(row.avg_rating.toFixed(2)) }));
}
