import { db } from "@/lib/db";
import { invalidateCache } from "@/lib/db/cache";
import { rowToApp } from "@/lib/db/apps-repo";
import type { App } from "@/lib/types";

export type FavoriteKind = "app" | "ad" | "organic";

export function isFavorite(kind: FavoriteKind, refId: string): boolean {
  const row = db()
    .prepare("SELECT 1 AS hit FROM favorites WHERE kind = ? AND ref_id = ?")
    .get(kind, refId) as { hit: number } | undefined;
  return Boolean(row);
}

/** Returns the state after the toggle, so callers can render without a re-read. */
export function toggleFavorite(kind: FavoriteKind, refId: string): boolean {
  invalidateCache();

  if (isFavorite(kind, refId)) {
    db().prepare("DELETE FROM favorites WHERE kind = ? AND ref_id = ?").run(kind, refId);
    return false;
  }
  db()
    .prepare("INSERT INTO favorites (id, kind, ref_id, created_at) VALUES (?, ?, ?, ?)")
    .run(`${kind}:${refId}`, kind, refId, new Date().toISOString());
  return true;
}

export function favoriteIds(kind: FavoriteKind): Set<string> {
  const rows = db().prepare("SELECT ref_id FROM favorites WHERE kind = ?").all(kind) as {
    ref_id: string;
  }[];
  return new Set(rows.map((r) => r.ref_id));
}

export function favoriteCounts(): Record<FavoriteKind, number> {
  const rows = db().prepare("SELECT kind, COUNT(*) AS n FROM favorites GROUP BY kind").all() as {
    kind: FavoriteKind;
    n: number;
  }[];
  const counts: Record<FavoriteKind, number> = { app: 0, ad: 0, organic: 0 };
  for (const row of rows) counts[row.kind] = row.n;
  return counts;
}

export function favoriteApps(): App[] {
  const rows = db()
    .prepare(
      `SELECT a.* FROM favorites f JOIN apps a ON a.id = f.ref_id
       WHERE f.kind = 'app' ORDER BY f.created_at DESC`,
    )
    .all() as Record<string, unknown>[];
  return rows.map(rowToApp);
}

export function favoriteCreatives() {
  return db()
    .prepare(
      `SELECT c.*, a.title AS app_title, a.developer AS app_developer
       FROM favorites f JOIN creatives c ON c.id = f.ref_id JOIN apps a ON a.id = c.app_id
       WHERE f.kind = 'ad' ORDER BY f.created_at DESC`,
    )
    .all() as Record<string, unknown>[];
}

export function favoriteOrganic() {
  return db()
    .prepare(
      `SELECT o.*, a.title AS app_title, a.category AS app_category
       FROM favorites f JOIN organic_posts o ON o.id = f.ref_id JOIN apps a ON a.id = o.app_id
       WHERE f.kind = 'organic' ORDER BY f.created_at DESC`,
    )
    .all() as Record<string, unknown>[];
}
