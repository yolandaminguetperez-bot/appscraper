import { db } from "@/lib/db";
import type { App, Store } from "@/lib/types";

type Row = Record<string, unknown>;

function json<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value.length === 0) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function rowToApp(row: Row): App {
  return {
    id: row.id as string,
    store: row.store as Store,
    storeId: row.store_id as string,
    bundleId: (row.bundle_id as string) ?? null,
    title: row.title as string,
    subtitle: (row.subtitle as string) ?? null,
    description: (row.description as string) ?? null,
    developer: (row.developer as string) ?? null,
    developerId: (row.developer_id as string) ?? null,
    developerUrl: (row.developer_url as string) ?? null,
    iconUrl: (row.icon_url as string) ?? null,
    storeUrl: (row.store_url as string) ?? null,
    category: (row.category as string) ?? null,
    categories: json<string[]>(row.categories_json, []),
    price: (row.price as number) ?? 0,
    currency: (row.currency as string) ?? null,
    hasIap: Boolean(row.has_iap),
    contentRating: (row.content_rating as string) ?? null,
    primaryLanguage: (row.primary_language as string) ?? null,
    languages: json<string[]>(row.languages_json, []),
    rating: (row.rating as number) ?? null,
    ratingCount: (row.rating_count as number) ?? null,
    version: (row.version as string) ?? null,
    sizeBytes: (row.size_bytes as number) ?? null,
    releasedAt: (row.released_at as string) ?? null,
    updatedAt: (row.updated_at as string) ?? null,
    screenshots: json<string[]>(row.screenshots_json, []),
    estDownloads: (row.est_downloads as number) ?? null,
    estRevenue: (row.est_revenue as number) ?? null,
    estMrr: (row.est_mrr as number) ?? null,
    isGame: Boolean(row.is_game),
    fetchedAt: row.fetched_at as string,
  };
}

const UPSERT = `
INSERT INTO apps (
  id, store, store_id, bundle_id, title, subtitle, description, developer, developer_id,
  developer_url, icon_url, store_url, category, categories_json, price, currency, has_iap,
  content_rating, primary_language, languages_json, rating, rating_count, version, size_bytes,
  released_at, updated_at, screenshots_json, est_downloads, est_revenue, est_mrr, is_game, fetched_at
) VALUES (
  @id, @store, @store_id, @bundle_id, @title, @subtitle, @description, @developer, @developer_id,
  @developer_url, @icon_url, @store_url, @category, @categories_json, @price, @currency, @has_iap,
  @content_rating, @primary_language, @languages_json, @rating, @rating_count, @version, @size_bytes,
  @released_at, @updated_at, @screenshots_json, @est_downloads, @est_revenue, @est_mrr, @is_game, @fetched_at
)
ON CONFLICT (id) DO UPDATE SET
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  developer = excluded.developer,
  developer_id = excluded.developer_id,
  developer_url = excluded.developer_url,
  icon_url = excluded.icon_url,
  store_url = excluded.store_url,
  category = excluded.category,
  categories_json = excluded.categories_json,
  price = excluded.price,
  currency = excluded.currency,
  has_iap = excluded.has_iap,
  content_rating = excluded.content_rating,
  primary_language = excluded.primary_language,
  languages_json = excluded.languages_json,
  rating = excluded.rating,
  rating_count = excluded.rating_count,
  version = excluded.version,
  size_bytes = excluded.size_bytes,
  released_at = excluded.released_at,
  updated_at = excluded.updated_at,
  screenshots_json = excluded.screenshots_json,
  est_downloads = excluded.est_downloads,
  est_revenue = excluded.est_revenue,
  est_mrr = excluded.est_mrr,
  is_game = excluded.is_game,
  fetched_at = excluded.fetched_at
`;

function appToRow(app: App) {
  return {
    id: app.id,
    store: app.store,
    store_id: app.storeId,
    bundle_id: app.bundleId ?? null,
    title: app.title,
    subtitle: app.subtitle ?? null,
    description: app.description ?? null,
    developer: app.developer ?? null,
    developer_id: app.developerId ?? null,
    developer_url: app.developerUrl ?? null,
    icon_url: app.iconUrl ?? null,
    store_url: app.storeUrl ?? null,
    category: app.category ?? null,
    categories_json: JSON.stringify(app.categories ?? []),
    price: app.price ?? 0,
    currency: app.currency ?? null,
    has_iap: app.hasIap ? 1 : 0,
    content_rating: app.contentRating ?? null,
    primary_language: app.primaryLanguage ?? null,
    languages_json: JSON.stringify(app.languages ?? []),
    rating: app.rating ?? null,
    rating_count: app.ratingCount ?? null,
    version: app.version ?? null,
    size_bytes: app.sizeBytes ?? null,
    released_at: app.releasedAt ?? null,
    updated_at: app.updatedAt ?? null,
    screenshots_json: JSON.stringify(app.screenshots ?? []),
    est_downloads: app.estDownloads ?? null,
    est_revenue: app.estRevenue ?? null,
    est_mrr: app.estMrr ?? null,
    is_game: app.isGame ? 1 : 0,
    fetched_at: app.fetchedAt,
  };
}

export function upsertApps(apps: App[]): number {
  if (apps.length === 0) return 0;
  const stmt = db().prepare(UPSERT);
  const run = db().transaction((batch: App[]) => {
    for (const app of batch) stmt.run(appToRow(app));
  });
  run(apps);
  return apps.length;
}

export function getApp(id: string): App | null {
  const row = db().prepare("SELECT * FROM apps WHERE id = ?").get(id) as Row | undefined;
  return row ? rowToApp(row) : null;
}

export function countApps(): number {
  const row = db().prepare("SELECT COUNT(*) AS n FROM apps").get() as { n: number };
  return row.n;
}
