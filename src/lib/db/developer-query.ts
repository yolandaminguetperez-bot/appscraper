import { db } from "@/lib/db";
import { rowToApp } from "@/lib/db/apps-repo";
import { cached } from "@/lib/db/cache";
import type { App } from "@/lib/types";

type Row = Record<string, unknown>;

export type DeveloperSummary = {
  name: string;
  apps: number;
  downloads: number;
  mrr: number;
  revenue: number;
  avgRating: number | null;
  categories: { label: string; count: number }[];
  stores: { ios: number; android: number };
  advertising: number;
};

export function developerNames(limit = 200): string[] {
  return cached(`developerNames:${limit}`, () => {
    const rows = db()
      .prepare(
        `SELECT developer FROM apps WHERE developer IS NOT NULL
         GROUP BY developer ORDER BY COALESCE(SUM(est_revenue), 0) DESC LIMIT ?`,
      )
      .all(limit) as { developer: string }[];
    return rows.map((r) => r.developer);
  });
}

export function developerSummary(name: string): DeveloperSummary | null {
  const totals = db()
    .prepare(
      `SELECT COUNT(*) AS apps,
              COALESCE(SUM(est_downloads), 0) AS downloads,
              COALESCE(SUM(est_mrr), 0) AS mrr,
              COALESCE(SUM(est_revenue), 0) AS revenue,
              AVG(rating) AS avg_rating,
              SUM(CASE WHEN store = 'ios' THEN 1 ELSE 0 END) AS ios,
              SUM(CASE WHEN store = 'android' THEN 1 ELSE 0 END) AS android,
              SUM(CASE WHEN EXISTS (SELECT 1 FROM creatives c WHERE c.app_id = apps.id)
                       THEN 1 ELSE 0 END) AS advertising
       FROM apps WHERE developer = ?`,
    )
    .get(name) as Row | undefined;

  if (!totals || (totals.apps as number) === 0) return null;

  const categories = (
    db()
      .prepare(
        `SELECT category AS label, COUNT(*) AS count FROM apps
         WHERE developer = ? AND category IS NOT NULL
         GROUP BY category ORDER BY count DESC`,
      )
      .all(name) as { label: string; count: number }[]
  );

  return {
    name,
    apps: totals.apps as number,
    downloads: totals.downloads as number,
    mrr: totals.mrr as number,
    revenue: totals.revenue as number,
    avgRating: (totals.avg_rating as number) ?? null,
    categories,
    stores: { ios: (totals.ios as number) ?? 0, android: (totals.android as number) ?? 0 },
    advertising: (totals.advertising as number) ?? 0,
  };
}

export function developerApps(name: string): App[] {
  const rows = db()
    .prepare("SELECT * FROM apps WHERE developer = ? ORDER BY est_revenue DESC")
    .all(name) as Row[];
  return rows.map(rowToApp);
}

/** Apps in the same category, excluding this developer's own — the usual next question. */
export function similarApps(app: App, limit = 6): App[] {
  if (!app.category) return [];
  const rows = db()
    .prepare(
      `SELECT * FROM apps
       WHERE category = ? AND id != ? AND (developer IS NULL OR developer != ?)
       ORDER BY ABS(COALESCE(est_downloads, 0) - ?) ASC
       LIMIT ?`,
    )
    .all(app.category, app.id, app.developer ?? "", app.estDownloads ?? 0, limit) as Row[];
  return rows.map(rowToApp);
}
