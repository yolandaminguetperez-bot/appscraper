import { db } from "@/lib/db";
import { cached } from "@/lib/db/cache";
import { rowToApp } from "@/lib/db/apps-repo";
import type { App } from "@/lib/types";

type Row = Record<string, unknown>;

export type Totals = {
  apps: number;
  ios: number;
  android: number;
  mrr: number;
  downloads: number;
  advertisers: number;
  creatives: number;
  organicPosts: number;
  flows: number;
  reviews: number;
};

function computeOverviewTotals(): Totals {
  const one = <T>(sql: string): T => db().prepare(sql).get() as T;

  const apps = one<{ n: number; ios: number; android: number; mrr: number; downloads: number }>(
    `SELECT COUNT(*) AS n,
            SUM(CASE WHEN store = 'ios' THEN 1 ELSE 0 END) AS ios,
            SUM(CASE WHEN store = 'android' THEN 1 ELSE 0 END) AS android,
            COALESCE(SUM(est_mrr), 0) AS mrr,
            COALESCE(SUM(est_downloads), 0) AS downloads
     FROM apps`,
  );

  const creatives = one<{ n: number; advertisers: number }>(
    "SELECT COUNT(*) AS n, COUNT(DISTINCT app_id) AS advertisers FROM creatives",
  );

  return {
    apps: apps.n,
    ios: apps.ios,
    android: apps.android,
    mrr: apps.mrr,
    downloads: apps.downloads,
    advertisers: creatives.advertisers,
    creatives: creatives.n,
    organicPosts: one<{ n: number }>("SELECT COUNT(*) AS n FROM organic_posts").n,
    flows: one<{ n: number }>("SELECT COUNT(*) AS n FROM flows").n,
    reviews: one<{ n: number }>("SELECT COUNT(*) AS n FROM reviews").n,
  };
}

export function overviewTotals(): Totals {
  return cached("overviewTotals", () => computeOverviewTotals());
}

export type CategorySlice = { label: string; value: number; apps: number };

function computeRevenueByCategory(limit = 10): CategorySlice[] {
  const rows = db()
    .prepare(
      `SELECT category AS label, COALESCE(SUM(est_mrr), 0) AS value, COUNT(*) AS apps
       FROM apps WHERE category IS NOT NULL
       GROUP BY category ORDER BY value DESC LIMIT ?`,
    )
    .all(limit) as Row[];

  return rows.map((row) => ({
    label: row.label as string,
    value: row.value as number,
    apps: row.apps as number,
  }));
}

export function revenueByCategory(limit = 10): CategorySlice[] {
  return cached(`revenueByCategory:${limit}`, () => computeRevenueByCategory(limit));
}

function computeReleasesByMonth(months = 18): { day: string; value: number }[] {
  const since = new Date(Date.now() - months * 30.44 * 86400000).toISOString();
  const rows = db()
    .prepare(
      `SELECT substr(released_at, 1, 7) AS month, COUNT(*) AS n
       FROM apps WHERE released_at >= ?
       GROUP BY month ORDER BY month ASC`,
    )
    .all(since) as { month: string; n: number }[];

  return rows.filter((r) => r.month).map((r) => ({ day: `${r.month}-01`, value: r.n }));
}

export function releasesByMonth(months = 18): { day: string; value: number }[] {
  return cached(`releasesByMonth:${months}`, () => computeReleasesByMonth(months));
}

function computeTopMovers(limit = 6): { app: App; gained: number }[] {
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const rows = db()
    .prepare(
      `WITH bounds AS (
         SELECT app_id, MIN(rating_count) AS lo, MAX(rating_count) AS hi
         FROM app_metrics WHERE day >= ? GROUP BY app_id
       )
       SELECT a.*, (b.hi - b.lo) AS gained
       FROM bounds b JOIN apps a ON a.id = b.app_id
       WHERE a.rating_count >= 1000
       ORDER BY gained DESC LIMIT ?`,
    )
    .all(since, limit) as Row[];

  return rows.map((row) => ({ app: rowToApp(row), gained: (row.gained as number) ?? 0 }));
}

export function topMovers(limit = 6): { app: App; gained: number }[] {
  return cached(`topMovers:${limit}`, () => computeTopMovers(limit));
}

export type PlatformSlice = { label: string; value: number };

function computeOrganicByPlatform(): PlatformSlice[] {
  const rows = db()
    .prepare(
      "SELECT platform AS label, COUNT(*) AS value FROM organic_posts GROUP BY platform ORDER BY value DESC",
    )
    .all() as Row[];
  return rows.map((row) => ({ label: row.label as string, value: row.value as number }));
}

export function organicByPlatform(): PlatformSlice[] {
  return cached("organicByPlatform", () => computeOrganicByPlatform());
}

function computeCreativesByFormat(): PlatformSlice[] {
  const rows = db()
    .prepare("SELECT kind AS label, COUNT(*) AS value FROM creatives GROUP BY kind ORDER BY value DESC")
    .all() as Row[];
  return rows.map((row) => ({ label: row.label as string, value: row.value as number }));
}

export function creativesByFormat(): PlatformSlice[] {
  return cached("creativesByFormat", () => computeCreativesByFormat());
}

function computeScreenTypeMix(limit = 8): PlatformSlice[] {
  const rows = db()
    .prepare(
      `SELECT screen_type AS label, COUNT(*) AS value FROM flow_screens
       WHERE screen_type IS NOT NULL GROUP BY screen_type ORDER BY value DESC LIMIT ?`,
    )
    .all(limit) as Row[];
  return rows.map((row) => ({ label: row.label as string, value: row.value as number }));
}

export function screenTypeMix(limit = 8): PlatformSlice[] {
  return cached(`screenTypeMix:${limit}`, () => computeScreenTypeMix(limit));
}
