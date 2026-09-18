/**
 * Exports a slice of the catalogue as JSON for the static preview artifact.
 * The preview is a snapshot: it carries its own data and needs no server.
 */
import Database from "better-sqlite3";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, copyFileSync, readdirSync, readFileSync } from "node:fs";
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

// App marks, rendered by the same function the app serves from /api/icon so the
// preview shows the real artwork rather than grey squares.
// Every id the preview can render, not just the app slice: the chart-movement
// panels name apps that fall outside the top 120, and a missing entry there
// renders a broken image rather than a mark.
function renderIcons(idList) {
  const payload = JSON.stringify(JSON.stringify(idList));
  const source = `
    import { iconSvg } from "./src/lib/identicon";
    const ids = JSON.parse(${payload});
    process.stdout.write(JSON.stringify(ids.map((id) => [id, iconSvg(id, 64)])));
  `;

  return Object.fromEntries(
    JSON.parse(execFileSync("npx", ["tsx", "-e", source], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })),
  );
}

// Countries: chart overlap with the US, and where the creatives run. Both are
// the same numbers the live pages show.
const day = db.prepare("SELECT MAX(day) AS day FROM rankings WHERE store='ios' AND chart='free'").get().day;
const overlap = db
  .prepare(
    `SELECT r.country, COUNT(*) AS apps,
            SUM(CASE WHEN EXISTS (
              SELECT 1 FROM rankings cur WHERE cur.store = r.store AND cur.chart = r.chart
                AND cur.day = r.day AND cur.country = 'us' AND cur.app_id = r.app_id
            ) THEN 1 ELSE 0 END) AS shared
     FROM rankings r WHERE r.store='ios' AND r.chart='free' AND r.day = ?
     GROUP BY r.country`,
  )
  .all(day)
  .map((row) => ({ code: row.country, apps: row.apps, shared: row.shared }));

const adReach = {};
for (const row of db.prepare("SELECT countries_json FROM creatives").all()) {
  for (const code of JSON.parse(row.countries_json ?? "[]")) {
    adReach[code] = (adReach[code] ?? 0) + 1;
  }
}

// One extra slice per app for the quick-look panel.
const detailRows = db
  .prepare(
    `SELECT a.id, a.description,
            (SELECT COUNT(*) FROM creatives c WHERE c.app_id = a.id) AS ads,
            (SELECT COUNT(*) FROM organic_posts o WHERE o.app_id = a.id) AS organic,
            (SELECT COUNT(*) FROM reviews rv WHERE rv.app_id = a.id) AS reviews
     FROM apps a WHERE a.id IN (${ids.map(() => "?").join(",")})`,
  )
  .all(...ids);
const details = Object.fromEntries(
  detailRows.map((row) => [row.id, { description: row.description, ads: row.ads, organic: row.organic, reviews: row.reviews }]),
);

const world = JSON.parse(readFileSync("src/lib/geo/world.json", "utf8"));

// Search positions and market splits for the apps in the slice, so the preview
// can show the same ASO panels the app does.
const rankRows = db
  .prepare(
    `SELECT r.app_id, k.term, r.position, r.day
     FROM keyword_ranks r JOIN keywords k ON k.id = r.keyword_id
     WHERE r.app_id IN (${ids.map(() => "?").join(",")})
     ORDER BY r.app_id, k.term, r.day ASC`,
  )
  .all(...ids);

const keywordRanks = {};
for (const row of rankRows) {
  const perApp = (keywordRanks[row.app_id] ??= {});
  (perApp[row.term] ??= []).push(row.position);
}

const marketRows = db
  .prepare(
    `SELECT app_id, country, share, revenue FROM app_countries
     WHERE app_id IN (${ids.map(() => "?").join(",")})
     ORDER BY app_id, share DESC`,
  )
  .all(...ids);

const markets = {};
for (const row of marketRows) {
  (markets[row.app_id] ??= []).push({
    code: row.country,
    share: row.share,
    revenue: row.revenue,
  });
}

// What moved in the US free chart over the last week.
const chartDay = db.prepare("SELECT MAX(day) AS day FROM rankings WHERE store='ios' AND chart='free' AND country='us'").get().day;
const beforeDay = db
  .prepare("SELECT MAX(day) AS day FROM rankings WHERE store='ios' AND chart='free' AND country='us' AND day <= ?")
  .get(new Date(Date.parse(chartDay) - 7 * 86400000).toISOString().slice(0, 10)).day;

const movementRows = db
  .prepare(
    `SELECT a.id, a.title, now.position, before.position AS previous
     FROM rankings now
     JOIN apps a ON a.id = now.app_id
     LEFT JOIN rankings before ON before.app_id = now.app_id AND before.store='ios'
       AND before.chart='free' AND before.country='us' AND before.day = ?
     WHERE now.store='ios' AND now.chart='free' AND now.country='us' AND now.day = ?`,
  )
  .all(beforeDay, chartDay)
  .map((row) => ({
    id: row.id,
    title: row.title,
    position: row.position,
    change: row.previous == null ? null : row.previous - row.position,
  }));

const exitRows = db
  .prepare(
    `SELECT a.id, a.title, before.position
     FROM rankings before JOIN apps a ON a.id = before.app_id
     WHERE before.store='ios' AND before.chart='free' AND before.country='us' AND before.day = ?
       AND NOT EXISTS (SELECT 1 FROM rankings now WHERE now.app_id = before.app_id
         AND now.store='ios' AND now.chart='free' AND now.country='us' AND now.day = ?)
     ORDER BY before.position ASC LIMIT 5`,
  )
  .all(beforeDay, chartDay);

const ranked = movementRows.filter((row) => row.change !== null);
const movement = {
  since: beforeDay,
  climbers: [...ranked].sort((a, b) => b.change - a.change).slice(0, 5),
  fallers: [...ranked].sort((a, b) => a.change - b.change).slice(0, 5),
  entries: movementRows.filter((row) => row.change === null).sort((a, b) => a.position - b.position).slice(0, 5),
  exits: exitRows.map((row) => ({ id: row.id, title: row.title, position: row.position })),
};

const icons = renderIcons([
  ...new Set([
    ...ids,
    ...movement.climbers.map((row) => row.id),
    ...movement.fallers.map((row) => row.id),
    ...movement.entries.map((row) => row.id),
    ...movement.exits.map((row) => row.id),
  ]),
]);

const payload = { apps, trends, creatives, organic, categories, totals, counts, icons, overlap, adReach, details, world, keywordRanks, markets, movement };
writeFileSync(path.join(OUT, "data.json"), JSON.stringify(payload));

console.log(
  `apps=${apps.length} creatives=${creatives.length} organic=${organic.length} media=${wanted.size} ` +
    `icons=${Object.keys(icons).length} countries=${overlap.length} world=${world.countries.length} ` +
    `ranked=${Object.keys(keywordRanks).length} markets=${Object.keys(markets).length} moved=${movement.climbers.length}`,
);
