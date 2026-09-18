import { db } from "@/lib/db";
import { rowToApp } from "@/lib/db/apps-repo";
import type { App } from "@/lib/types";

export type Creative = {
  id: string;
  appId: string;
  network: string;
  kind: string;
  headline: string | null;
  body: string | null;
  cta: string | null;
  mediaUrl: string | null;
  thumbUrl: string | null;
  landingUrl: string | null;
  firstSeen: string | null;
  lastSeen: string | null;
  daysRunning: number | null;
  countries: string[];
};

export type OrganicPost = {
  id: string;
  appId: string;
  platform: string;
  author: string | null;
  authorFollowers: number | null;
  caption: string | null;
  postUrl: string | null;
  thumbUrl: string | null;
  mediaUrl: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  postedAt: string | null;
};

type Row = Record<string, unknown>;

function parseList(value: unknown): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToCreative(row: Row): Creative {
  return {
    id: row.id as string,
    appId: row.app_id as string,
    network: row.network as string,
    kind: row.kind as string,
    headline: (row.headline as string) ?? null,
    body: (row.body as string) ?? null,
    cta: (row.cta as string) ?? null,
    mediaUrl: (row.media_url as string) ?? null,
    thumbUrl: (row.thumb_url as string) ?? null,
    landingUrl: (row.landing_url as string) ?? null,
    firstSeen: (row.first_seen as string) ?? null,
    lastSeen: (row.last_seen as string) ?? null,
    daysRunning: (row.days_running as number) ?? null,
    countries: parseList(row.countries_json),
  };
}

function rowToOrganic(row: Row): OrganicPost {
  return {
    id: row.id as string,
    appId: row.app_id as string,
    platform: row.platform as string,
    author: (row.author as string) ?? null,
    authorFollowers: (row.author_followers as number) ?? null,
    caption: (row.caption as string) ?? null,
    postUrl: (row.post_url as string) ?? null,
    thumbUrl: (row.thumb_url as string) ?? null,
    mediaUrl: (row.media_url as string) ?? null,
    views: (row.views as number) ?? null,
    likes: (row.likes as number) ?? null,
    comments: (row.comments as number) ?? null,
    postedAt: (row.posted_at as string) ?? null,
  };
}

/** One app plus the creatives it is running — the shape the grouped Ads view renders. */
export type AdGroup = { app: App; creatives: Creative[]; total: number };

export type AdFilters = {
  q?: string;
  categories?: string[];
  languages?: string[];
  minMrr?: number;
  minDownloads?: number;
  minAds?: number;
  minDaysRunning?: number;
  sort?: "ads" | "revenue" | "downloads" | "recent";
  page?: number;
  perPage?: number;
};

function adWhere(f: AdFilters) {
  const sql: string[] = ["EXISTS (SELECT 1 FROM creatives c WHERE c.app_id = a.id)"];
  const params: unknown[] = [];

  if (f.q) {
    sql.push("(a.title LIKE ? OR a.developer LIKE ?)");
    params.push(`%${f.q}%`, `%${f.q}%`);
  }
  if (f.categories?.length) {
    sql.push(`a.category IN (${f.categories.map(() => "?").join(",")})`);
    params.push(...f.categories);
  }
  if (f.languages?.length) {
    sql.push(`a.primary_language IN (${f.languages.map(() => "?").join(",")})`);
    params.push(...f.languages);
  }
  if (f.minMrr !== undefined) {
    sql.push("a.est_mrr >= ?");
    params.push(f.minMrr);
  }
  if (f.minDownloads !== undefined) {
    sql.push("a.est_downloads >= ?");
    params.push(f.minDownloads);
  }
  if (f.minAds !== undefined) {
    sql.push("(SELECT COUNT(*) FROM creatives c2 WHERE c2.app_id = a.id) >= ?");
    params.push(f.minAds);
  }
  if (f.minDaysRunning !== undefined) {
    sql.push("EXISTS (SELECT 1 FROM creatives c3 WHERE c3.app_id = a.id AND c3.days_running >= ?)");
    params.push(f.minDaysRunning);
  }

  return { sql: `WHERE ${sql.join(" AND ")}`, params };
}

const AD_SORTS = {
  ads: "ad_count DESC",
  revenue: "a.est_mrr DESC",
  downloads: "a.est_downloads DESC",
  recent: "last_seen DESC",
} as const;

export function queryAdGroups(f: AdFilters = {}) {
  const where = adWhere(f);
  const perPage = Math.min(Math.max(f.perPage ?? 24, 1), 100);
  const page = Math.max(f.page ?? 1, 1);
  const order = AD_SORTS[f.sort ?? "ads"];

  const total = (
    db().prepare(`SELECT COUNT(*) AS n FROM apps a ${where.sql}`).get(...where.params) as { n: number }
  ).n;

  const rows = db()
    .prepare(
      `SELECT a.*,
              (SELECT COUNT(*) FROM creatives c2 WHERE c2.app_id = a.id) AS ad_count,
              (SELECT MAX(c3.last_seen) FROM creatives c3 WHERE c3.app_id = a.id) AS last_seen
       FROM apps a ${where.sql}
       ORDER BY ${order}, a.id ASC
       LIMIT ? OFFSET ?`,
    )
    .all(...where.params, perPage, (page - 1) * perPage) as Row[];

  const creativeStmt = db().prepare(
    "SELECT * FROM creatives WHERE app_id = ? ORDER BY days_running DESC LIMIT 4",
  );

  const groups: AdGroup[] = rows.map((row) => ({
    app: rowToApp(row),
    creatives: (creativeStmt.all(row.id) as Row[]).map(rowToCreative),
    total: (row.ad_count as number) ?? 0,
  }));

  return { groups, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export function queryCreatives(f: AdFilters = {}) {
  const where = adWhere(f);
  const perPage = Math.min(Math.max(f.perPage ?? 48, 1), 200);
  const page = Math.max(f.page ?? 1, 1);

  const total = (
    db()
      .prepare(`SELECT COUNT(*) AS n FROM creatives c JOIN apps a ON a.id = c.app_id ${where.sql}`)
      .get(...where.params) as { n: number }
  ).n;

  const rows = db()
    .prepare(
      `SELECT c.*, a.title AS app_title, a.developer AS app_developer, a.store AS app_store
       FROM creatives c JOIN apps a ON a.id = c.app_id ${where.sql}
       ORDER BY c.days_running DESC, c.id ASC
       LIMIT ? OFFSET ?`,
    )
    .all(...where.params, perPage, (page - 1) * perPage) as Row[];

  const creatives = rows.map((row) => ({
    ...rowToCreative(row),
    appTitle: row.app_title as string,
    appDeveloper: (row.app_developer as string) ?? null,
  }));

  return { creatives, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export type OrganicFilters = {
  q?: string;
  platforms?: string[];
  categories?: string[];
  minViews?: number;
  minLikes?: number;
  minFollowers?: number;
  minDownloads?: number;
  minMrr?: number;
  sort?: "views" | "likes" | "recent" | "followers";
  page?: number;
  perPage?: number;
};

const ORGANIC_SORTS = {
  views: "o.views DESC",
  likes: "o.likes DESC",
  recent: "o.posted_at DESC",
  followers: "o.author_followers DESC",
} as const;

export function queryOrganic(f: OrganicFilters = {}) {
  const sql: string[] = ["1 = 1"];
  const params: unknown[] = [];

  if (f.q) {
    sql.push("(a.title LIKE ? OR o.author LIKE ? OR o.caption LIKE ?)");
    params.push(`%${f.q}%`, `%${f.q}%`, `%${f.q}%`);
  }
  if (f.platforms?.length) {
    sql.push(`o.platform IN (${f.platforms.map(() => "?").join(",")})`);
    params.push(...f.platforms);
  }
  if (f.categories?.length) {
    sql.push(`a.category IN (${f.categories.map(() => "?").join(",")})`);
    params.push(...f.categories);
  }
  const numeric: [keyof OrganicFilters, string][] = [
    ["minViews", "o.views"],
    ["minLikes", "o.likes"],
    ["minFollowers", "o.author_followers"],
    ["minDownloads", "a.est_downloads"],
    ["minMrr", "a.est_mrr"],
  ];
  for (const [key, column] of numeric) {
    const value = f[key] as number | undefined;
    if (value !== undefined) {
      sql.push(`${column} >= ?`);
      params.push(value);
    }
  }

  const where = `WHERE ${sql.join(" AND ")}`;
  const perPage = Math.min(Math.max(f.perPage ?? 36, 1), 200);
  const page = Math.max(f.page ?? 1, 1);

  const total = (
    db()
      .prepare(`SELECT COUNT(*) AS n FROM organic_posts o JOIN apps a ON a.id = o.app_id ${where}`)
      .get(...params) as { n: number }
  ).n;

  const rows = db()
    .prepare(
      `SELECT o.*, a.title AS app_title, a.developer AS app_developer, a.category AS app_category
       FROM organic_posts o JOIN apps a ON a.id = o.app_id ${where}
       ORDER BY ${ORGANIC_SORTS[f.sort ?? "views"]}, o.id ASC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, perPage, (page - 1) * perPage) as Row[];

  const posts = rows.map((row) => ({
    ...rowToOrganic(row),
    appTitle: row.app_title as string,
    appDeveloper: (row.app_developer as string) ?? null,
    appCategory: (row.app_category as string) ?? null,
    appIconUrl: (row.app_icon_url as string) ?? null,
  }));

  return { posts, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export function distinctPlatforms(): string[] {
  const rows = db()
    .prepare("SELECT DISTINCT platform FROM organic_posts ORDER BY platform")
    .all() as { platform: string }[];
  return rows.map((r) => r.platform);
}
