import { db } from "@/lib/db";
import { cached } from "@/lib/db/cache";
import { rowToApp } from "@/lib/db/apps-repo";
import type { App } from "@/lib/types";

export type FlowScreen = {
  id: string;
  flowId: string;
  position: number;
  screenType: string | null;
  imageUrl: string | null;
  note: string | null;
};

export type Flow = {
  id: string;
  appId: string;
  kind: string;
  title: string | null;
  capturedAt: string | null;
  screens: FlowScreen[];
  app: App;
};

type Row = Record<string, unknown>;

function rowToScreen(row: Row): FlowScreen {
  return {
    id: row.id as string,
    flowId: row.flow_id as string,
    position: row.position as number,
    screenType: (row.screen_type as string) ?? null,
    imageUrl: (row.image_url as string) ?? null,
    note: (row.note as string) ?? null,
  };
}

export type FlowFilters = {
  q?: string;
  kinds?: string[];
  screenTypes?: string[];
  categories?: string[];
  languages?: string[];
  minDownloads?: number;
  minMrr?: number;
  sort?: "revenue" | "downloads" | "screens" | "recent";
  page?: number;
  perPage?: number;
};

const SORTS = {
  revenue: "a.est_revenue DESC",
  downloads: "a.est_downloads DESC",
  screens: "screen_count DESC",
  recent: "f.captured_at DESC",
} as const;

export function queryFlows(f: FlowFilters = {}) {
  const sql: string[] = ["1 = 1"];
  const params: unknown[] = [];

  if (f.q) {
    sql.push("(a.title LIKE ? OR a.developer LIKE ?)");
    params.push(`%${f.q}%`, `%${f.q}%`);
  }
  if (f.kinds?.length) {
    sql.push(`f.kind IN (${f.kinds.map(() => "?").join(",")})`);
    params.push(...f.kinds);
  }
  if (f.categories?.length) {
    sql.push(`a.category IN (${f.categories.map(() => "?").join(",")})`);
    params.push(...f.categories);
  }
  if (f.languages?.length) {
    sql.push(`a.primary_language IN (${f.languages.map(() => "?").join(",")})`);
    params.push(...f.languages);
  }
  if (f.minDownloads !== undefined) {
    sql.push("a.est_downloads >= ?");
    params.push(f.minDownloads);
  }
  if (f.minMrr !== undefined) {
    sql.push("a.est_mrr >= ?");
    params.push(f.minMrr);
  }
  if (f.screenTypes?.length) {
    sql.push(
      `EXISTS (SELECT 1 FROM flow_screens s WHERE s.flow_id = f.id AND s.screen_type IN (${f.screenTypes
        .map(() => "?")
        .join(",")}))`,
    );
    params.push(...f.screenTypes);
  }

  const where = `WHERE ${sql.join(" AND ")}`;
  const perPage = Math.min(Math.max(f.perPage ?? 12, 1), 60);
  const page = Math.max(f.page ?? 1, 1);

  const total = (
    db()
      .prepare(`SELECT COUNT(*) AS n FROM flows f JOIN apps a ON a.id = f.app_id ${where}`)
      .get(...params) as { n: number }
  ).n;

  const rows = db()
    .prepare(
      `SELECT f.id AS flow_id, f.kind, f.title AS flow_title, f.captured_at, a.*,
              (SELECT COUNT(*) FROM flow_screens s2 WHERE s2.flow_id = f.id) AS screen_count
       FROM flows f JOIN apps a ON a.id = f.app_id ${where}
       ORDER BY ${SORTS[f.sort ?? "revenue"]}, f.id ASC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, perPage, (page - 1) * perPage) as Row[];

  const screensStmt = db().prepare("SELECT * FROM flow_screens WHERE flow_id = ? ORDER BY position");

  const flows: Flow[] = rows.map((row) => ({
    id: row.flow_id as string,
    appId: row.id as string,
    kind: row.kind as string,
    title: (row.flow_title as string) ?? null,
    capturedAt: (row.captured_at as string) ?? null,
    screens: (screensStmt.all(row.flow_id) as Row[]).map(rowToScreen),
    app: rowToApp(row),
  }));

  return { flows, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export function distinctScreenTypes(): string[] {
  return cached("distinctScreenTypes", () => {
  const rows = db()
    .prepare(
      "SELECT screen_type, COUNT(*) AS n FROM flow_screens WHERE screen_type IS NOT NULL GROUP BY screen_type ORDER BY n DESC",
    )
    .all() as { screen_type: string }[];
  return rows.map((r) => r.screen_type);
  });
}
