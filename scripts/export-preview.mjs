/**
 * Exports a slice of the catalogue as JSON for the static preview artifact.
 * The preview is a snapshot: it carries its own data and needs no server.
 */
import Database from "better-sqlite3";
import { writeFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import path from "node:path";

const OUT = process.argv[2] ?? "preview-build";
mkdirSync(path.join(OUT, "media"), { recursive: true });

const db = new Database("data/appscraper.db");

const apps = db
  .prepare(
    `SELECT id, store, title, developer, category, rating, rating_count, est_downloads,
            est_mrr, est_revenue, released_at, price, has_iap
     FROM apps ORDER BY est_revenue DESC LIMIT 120`,
  )
  .all()
  .map((a) => ({
    id: a.id,
    store: a.store,
    title: a.title,
    developer: a.developer,
    category: a.category,
    rating: a.rating,
    reviews: a.rating_count,
    downloads: a.est_downloads,
    mrr: a.est_mrr,
    revenue: a.est_revenue,
    released: a.released_at,
    price: a.price,
    iap: Boolean(a.has_iap),
  }));

const ids = apps.map((a) => a.id);
const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
const trendRows = db
  .prepare(
    `SELECT app_id, est_revenue FROM app_metrics
     WHERE day >= ? AND app_id IN (${ids.map(() => "?").join(",")}) ORDER BY app_id, day`,
  )
  .all(since, ...ids);

const trends = {};
for (const row of trendRows) (trends[row.app_id] ??= []).push(row.est_revenue ?? 0);

const creatives = db
  .prepare(
    `SELECT c.id, c.app_id, c.kind, c.headline, c.body, c.cta, c.media_url, c.thumb_url,
            c.days_running, a.title AS app_title
     FROM creatives c JOIN apps a ON a.id = c.app_id
     ORDER BY c.days_running DESC LIMIT 36`,
  )
  .all()
  .map((c) => ({
    id: c.id,
    appId: c.app_id,
    appTitle: c.app_title,
    kind: c.kind,
    headline: c.headline,
    body: c.body,
    cta: c.cta,
    media: path.basename(c.media_url ?? ""),
    poster: path.basename(c.thumb_url ?? ""),
    days: c.days_running,
  }));

const organic = db
  .prepare(
    `SELECT o.id, o.app_id, o.platform, o.author, o.caption, o.views, o.likes, o.comments,
            o.media_url, o.thumb_url, a.title AS app_title
     FROM organic_posts o JOIN apps a ON a.id = o.app_id
     ORDER BY o.views DESC LIMIT 24`,
  )
  .all()
  .map((o) => ({
    id: o.id,
    appId: o.app_id,
    appTitle: o.app_title,
    platform: o.platform,
    author: o.author,
    caption: o.caption,
    views: o.views,
    likes: o.likes,
    comments: o.comments,
    media: path.basename(o.media_url ?? ""),
    poster: path.basename(o.thumb_url ?? ""),
  }));

const categories = db
  .prepare(
    `SELECT category AS label, COALESCE(SUM(est_mrr),0) AS value, COUNT(*) AS apps
     FROM apps WHERE category IS NOT NULL GROUP BY category ORDER BY value DESC LIMIT 8`,
  )
  .all();

const totals = db
  .prepare(
    `SELECT COUNT(*) AS apps,
            SUM(CASE WHEN store='ios' THEN 1 ELSE 0 END) AS ios,
            COALESCE(SUM(est_mrr),0) AS mrr FROM apps`,
  )
  .get();

const counts = {
  creatives: db.prepare("SELECT COUNT(*) n FROM creatives").get().n,
  organic: db.prepare("SELECT COUNT(*) n FROM organic_posts").get().n,
  flows: db.prepare("SELECT COUNT(*) n FROM flows").get().n,
};

// Only the media the preview actually references.
const wanted = new Set(
  [...creatives, ...organic].flatMap((item) => [item.media, item.poster]).filter(Boolean),
);
for (const file of readdirSync("public/sample-creatives")) {
  if (wanted.has(file)) copyFileSync(path.join("public/sample-creatives", file), path.join(OUT, "media", file));
}

const payload = { apps, trends, creatives, organic, categories, totals, counts };
writeFileSync(path.join(OUT, "data.json"), JSON.stringify(payload));

console.log(
  `apps=${apps.length} creatives=${creatives.length} organic=${organic.length} media=${wanted.size}`,
);
