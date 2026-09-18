import { db } from "@/lib/db";

export type SavedView = {
  id: string;
  name: string;
  path: string;
  query: string;
  createdAt: string;
  lastUsedAt: string | null;
};

type Row = Record<string, unknown>;

function rowToView(row: Row): SavedView {
  return {
    id: row.id as string,
    name: row.name as string,
    path: row.path as string,
    query: row.query as string,
    createdAt: row.created_at as string,
    lastUsedAt: (row.last_used_at as string) ?? null,
  };
}

/** Query strings are normalised so the same filters saved twice collide. */
export function normalizeQuery(query: string): string {
  const params = new URLSearchParams(query);
  params.delete("page");

  const pairs = [...params.entries()].sort(([aKey, aVal], [bKey, bVal]) =>
    aKey === bKey ? aVal.localeCompare(bVal) : aKey.localeCompare(bKey),
  );

  const sorted = new URLSearchParams();
  for (const [key, value] of pairs) sorted.append(key, value);
  return sorted.toString();
}

export function listSavedViews(path?: string): SavedView[] {
  const rows = path
    ? (db()
        .prepare("SELECT * FROM saved_views WHERE path = ? ORDER BY name COLLATE NOCASE")
        .all(path) as Row[])
    : (db()
        .prepare("SELECT * FROM saved_views ORDER BY path, name COLLATE NOCASE")
        .all() as Row[]);

  return rows.map(rowToView);
}

export function findSavedView(path: string, query: string): SavedView | null {
  const row = db()
    .prepare("SELECT * FROM saved_views WHERE path = ? AND query = ?")
    .get(path, normalizeQuery(query)) as Row | undefined;
  return row ? rowToView(row) : null;
}

export function saveView(name: string, path: string, query: string): SavedView {
  const normalized = normalizeQuery(query);
  const trimmed = name.trim().slice(0, 60) || "Untitled view";
  const now = new Date().toISOString();

  db()
    .prepare(
      `INSERT INTO saved_views (id, name, path, query, created_at, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (path, query) DO UPDATE SET name = excluded.name`,
    )
    .run(`${path}:${normalized}`, trimmed, path, normalized, now, now);

  return findSavedView(path, normalized)!;
}

export function deleteSavedView(id: string): void {
  db().prepare("DELETE FROM saved_views WHERE id = ?").run(id);
}

export function touchSavedView(id: string): void {
  db().prepare("UPDATE saved_views SET last_used_at = ? WHERE id = ?").run(new Date().toISOString(), id);
}

export function renameSavedView(id: string, name: string): void {
  const trimmed = name.trim().slice(0, 60);
  if (!trimmed) return;
  db().prepare("UPDATE saved_views SET name = ? WHERE id = ?").run(trimmed, id);
}
