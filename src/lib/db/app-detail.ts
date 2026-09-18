import { db } from "@/lib/db";
import { getApp } from "@/lib/db/apps-repo";
import type { App } from "@/lib/types";

export type MetricPoint = { day: string; ratingCount: number | null; rating: number | null };

export type AppDetail = {
  app: App;
  history: MetricPoint[];
  reviews: {
    id: string;
    author: string | null;
    rating: number | null;
    title: string | null;
    body: string | null;
    postedAt: string | null;
  }[];
  creatives: { id: string; headline: string | null; daysRunning: number | null; kind: string }[];
  organic: { id: string; author: string | null; views: number | null; platform: string }[];
  flowScreens: { id: string; position: number; screenType: string | null }[];
  ratingBreakdown: { stars: number; count: number }[];
};

type Row = Record<string, unknown>;

export function getAppDetail(id: string): AppDetail | null {
  const app = getApp(id);
  if (!app) return null;

  const history = (
    db()
      .prepare(
        "SELECT day, rating_count, rating FROM app_metrics WHERE app_id = ? ORDER BY day ASC LIMIT 400",
      )
      .all(id) as Row[]
  ).map<MetricPoint>((row) => ({
    day: row.day as string,
    ratingCount: (row.rating_count as number) ?? null,
    rating: (row.rating as number) ?? null,
  }));

  const reviews = (
    db()
      .prepare(
        "SELECT id, author, rating, title, body, posted_at FROM reviews WHERE app_id = ? ORDER BY posted_at DESC LIMIT 12",
      )
      .all(id) as Row[]
  ).map((row) => ({
    id: row.id as string,
    author: (row.author as string) ?? null,
    rating: (row.rating as number) ?? null,
    title: (row.title as string) ?? null,
    body: (row.body as string) ?? null,
    postedAt: (row.posted_at as string) ?? null,
  }));

  const creatives = (
    db()
      .prepare(
        "SELECT id, headline, days_running, kind FROM creatives WHERE app_id = ? ORDER BY days_running DESC LIMIT 12",
      )
      .all(id) as Row[]
  ).map((row) => ({
    id: row.id as string,
    headline: (row.headline as string) ?? null,
    daysRunning: (row.days_running as number) ?? null,
    kind: row.kind as string,
  }));

  const organic = (
    db()
      .prepare(
        "SELECT id, author, views, platform FROM organic_posts WHERE app_id = ? ORDER BY views DESC LIMIT 12",
      )
      .all(id) as Row[]
  ).map((row) => ({
    id: row.id as string,
    author: (row.author as string) ?? null,
    views: (row.views as number) ?? null,
    platform: row.platform as string,
  }));

  const flowScreens = (
    db()
      .prepare(
        `SELECT s.id, s.position, s.screen_type FROM flow_screens s
         JOIN flows f ON f.id = s.flow_id
         WHERE f.app_id = ? ORDER BY s.position ASC`,
      )
      .all(id) as Row[]
  ).map((row) => ({
    id: row.id as string,
    position: row.position as number,
    screenType: (row.screen_type as string) ?? null,
  }));

  const breakdownRows = db()
    .prepare("SELECT rating AS stars, COUNT(*) AS count FROM reviews WHERE app_id = ? GROUP BY rating")
    .all(id) as { stars: number; count: number }[];
  const byStars = new Map(breakdownRows.map((r) => [r.stars, r.count]));
  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: byStars.get(stars) ?? 0 }));

  return { app, history, reviews, creatives, organic, flowScreens, ratingBreakdown };
}
