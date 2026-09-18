import { db } from "@/lib/db";
import { rowToApp } from "@/lib/db/apps-repo";
import type { App, Store } from "@/lib/types";

export type SortKey =
  | "revenue"
  | "downloads"
  | "rating"
  | "reviews"
  | "released"
  | "updated"
  | "title";

export type AppFilters = {
  q?: string;
  searchIn?: "title" | "developer" | "description";
  stores?: Store[];
  releasedWithinDays?: number;
  categories?: string[];
  excludeCategories?: string[];
  languages?: string[];
  priceMin?: number;
  priceMax?: number;
  hasIap?: boolean;
  minRevenue?: number;
  minDownloads?: number;
  minReviews?: number;
  minRating?: number;
  hasAds?: boolean;
  hasOrganic?: boolean;
  hasOnboarding?: boolean;
  sort?: SortKey;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
};

const SORT_COLUMNS: Record<SortKey, string> = {
  revenue: "a.est_revenue",
  downloads: "a.est_downloads",
  rating: "a.rating",
  reviews: "a.rating_count",
  released: "a.released_at",
  updated: "a.updated_at",
  title: "a.title",
};

type Clause = { sql: string; params: unknown[] };

function buildWhere(f: AppFilters): Clause {
  const sql: string[] = [];
  const params: unknown[] = [];

  if (f.q) {
    const column =
      f.searchIn === "developer" ? "a.developer" : f.searchIn === "description" ? "a.description" : "a.title";
    sql.push(`${column} LIKE ?`);
    params.push(`%${f.q}%`);
  }

  if (f.stores?.length) {
    sql.push(`a.store IN (${f.stores.map(() => "?").join(",")})`);
    params.push(...f.stores);
  }

  if (f.releasedWithinDays) {
    sql.push("a.released_at >= ?");
    params.push(new Date(Date.now() - f.releasedWithinDays * 86400000).toISOString());
  }

  if (f.categories?.length) {
    sql.push(`a.category IN (${f.categories.map(() => "?").join(",")})`);
    params.push(...f.categories);
  }

  if (f.excludeCategories?.length) {
    sql.push(`(a.category IS NULL OR a.category NOT IN (${f.excludeCategories.map(() => "?").join(",")}))`);
    params.push(...f.excludeCategories);
  }

  if (f.languages?.length) {
    sql.push(`a.primary_language IN (${f.languages.map(() => "?").join(",")})`);
    params.push(...f.languages);
  }

  if (f.priceMin !== undefined) {
    sql.push("a.price >= ?");
    params.push(f.priceMin);
  }
  if (f.priceMax !== undefined) {
    sql.push("a.price <= ?");
    params.push(f.priceMax);
  }
  if (f.hasIap !== undefined) {
    sql.push("a.has_iap = ?");
    params.push(f.hasIap ? 1 : 0);
  }
  if (f.minRevenue !== undefined) {
    sql.push("a.est_revenue >= ?");
    params.push(f.minRevenue);
  }
  if (f.minDownloads !== undefined) {
    sql.push("a.est_downloads >= ?");
    params.push(f.minDownloads);
  }
  if (f.minReviews !== undefined) {
    sql.push("a.rating_count >= ?");
    params.push(f.minReviews);
  }
  if (f.minRating !== undefined) {
    sql.push("a.rating >= ?");
    params.push(f.minRating);
  }

  if (f.hasAds) sql.push("EXISTS (SELECT 1 FROM creatives c WHERE c.app_id = a.id)");
  if (f.hasOrganic) sql.push("EXISTS (SELECT 1 FROM organic_posts o WHERE o.app_id = a.id)");
  if (f.hasOnboarding) sql.push("EXISTS (SELECT 1 FROM flows fl WHERE fl.app_id = a.id)");

  return { sql: sql.length ? `WHERE ${sql.join(" AND ")}` : "", params };
}

export type AppQueryResult = {
  apps: App[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
};

export function queryApps(f: AppFilters = {}): AppQueryResult {
  const where = buildWhere(f);
  const perPage = Math.min(Math.max(f.perPage ?? 50, 1), 200);
  const page = Math.max(f.page ?? 1, 1);
  const sortCol = SORT_COLUMNS[f.sort ?? "revenue"];
  const dir = f.dir === "asc" ? "ASC" : "DESC";

  const totalRow = db()
    .prepare(`SELECT COUNT(*) AS n FROM apps a ${where.sql}`)
    .get(...where.params) as { n: number };

  const rows = db()
    .prepare(
      `SELECT a.* FROM apps a ${where.sql}
       ORDER BY ${sortCol} ${dir} NULLS LAST, a.id ASC
       LIMIT ? OFFSET ?`,
    )
    .all(...where.params, perPage, (page - 1) * perPage) as Record<string, unknown>[];

  return {
    apps: rows.map(rowToApp),
    total: totalRow.n,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(totalRow.n / perPage)),
  };
}

export function distinctCategories(): string[] {
  const rows = db()
    .prepare("SELECT DISTINCT category FROM apps WHERE category IS NOT NULL ORDER BY category")
    .all() as { category: string }[];
  return rows.map((r) => r.category);
}

export function distinctLanguages(): string[] {
  const rows = db()
    .prepare(
      "SELECT DISTINCT primary_language FROM apps WHERE primary_language IS NOT NULL ORDER BY primary_language",
    )
    .all() as { primary_language: string }[];
  return rows.map((r) => r.primary_language);
}
