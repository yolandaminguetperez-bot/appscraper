/**
 * Seeds a deterministic sample dataset so every view is usable before the real
 * scrapers can reach the stores. Everything here is generated, not scraped.
 * Run: node scripts/seed.mjs
 */
import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const file = process.env.APPSCRAPER_DB ?? path.join(process.cwd(), "data", "appscraper.db");
mkdirSync(path.dirname(file), { recursive: true });
const db = new Database(file);
db.pragma("foreign_keys = ON");
db.exec(readFileSync("src/lib/db/schema.sql", "utf8"));

// Small deterministic PRNG so reseeding produces the same dataset.
let state = 20260918;
const rnd = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (min, max) => Math.round(min + rnd() * (max - min));

const CATEGORIES = [
  "Health & Fitness", "Photo & Video", "Productivity", "Finance", "Education",
  "Lifestyle", "Entertainment", "Social Networking", "Travel", "Food & Drink",
  "Utilities", "Shopping", "Music", "Business", "Games",
];
const NOUN = ["Loop", "Nest", "Pulse", "Atlas", "Ember", "Lumen", "Drift", "Aurora", "Vertex", "Quill", "Harbor", "Cinder", "Beacon", "Maple", "Orbit", "Prism", "Tidal", "Willow", "Zephyr", "Cobalt"];
const SUFFIX = ["AI", "Coach", "Studio", "Tracker", "Planner", "Journal", "Lab", "Buddy", "Pro", "Daily", "Habit", "Kit", "Cam", "Notes", "Budget"];
const DEVS = ["Northline Labs", "Fernbrook Studio", "Kettle & Co", "Lightfold", "Bluepine Software", "Marrow Digital", "Sunfield Apps", "Oxbow Interactive", "Hollow Pine", "Ninefold"];
const LANGS = ["en", "es", "de", "fr", "pt", "ja", "ko"];
const COUNTRIES = ["us", "gb", "de", "es", "fr", "br", "jp"];

// Rendered by scripts/make-sample-media.mjs — generated motion graphics, not scraped media.
const CLIPS = ["mint", "dusk", "ember", "tide", "rose", "slate", "citrus", "plum"].flatMap((scheme) =>
  [1, 2, 3].map((i) => `${scheme}-${i}`),
);
const clipUrl = (name, ext) => `/sample-creatives/${name}.${ext}`;

// Rendered by scripts/make-sample-screens.mjs — original wireframes, not captures.
const screenUrl = (type) => `/sample-screens/${type.toLowerCase().replace(/\s+/g, "-")}.svg`;

const SCREEN_TYPES = ["Onboarding", "Quiz", "Home", "Paywall", "Permissions", "Content", "Profile Setup", "Feature Intro", "Welcome", "Preferences", "Sign Up", "Settings", "Login", "Success", "Subscription", "Lesson", "Discount", "Search", "Checkout", "Other"];
const PLATFORMS = ["tiktok", "instagram", "youtube"];
const CTAS = ["Install now", "Get started", "Try free", "Download", "Learn more"];

const RATINGS_PER_DL = { ios: 0.012, android: 0.006 };
const monthsLive = (iso) => Math.max(1, Math.round((Date.now() - Date.parse(iso)) / (1000 * 60 * 60 * 24 * 30.44)));

// Scale is configurable so the load test can seed a realistic catalogue:
// SEED_APPS=25000 node scripts/seed.mjs
const APP_COUNT = Number(process.env.SEED_APPS ?? 420);

const apps = [];
for (let i = 0; i < APP_COUNT; i++) {
  const store = rnd() < 0.55 ? "ios" : "android";
  const title = `${pick(NOUN)} ${pick(SUFFIX)}`;
  const category = pick(CATEGORIES);
  const isGame = category === "Games";
  const price = rnd() < 0.12 ? Number((between(99, 999) / 100).toFixed(2)) : 0;
  const hasIap = price === 0 ? rnd() < 0.82 : rnd() < 0.4;
  const ratingCount = Math.round(10 ** (1.2 + rnd() * 4.3));
  const ageDays = between(3, 2600);
  const releasedAt = new Date(Date.now() - ageDays * 86400000).toISOString();
  const updatedAt = new Date(Date.now() - between(0, Math.min(ageDays, 120)) * 86400000).toISOString();
  const storeId = store === "ios" ? String(600000000 + i * 7919) : `com.${title.split(" ")[0].toLowerCase()}.${title.split(" ")[1].toLowerCase()}${i}`;
  const id = `${store}:${storeId}`;
  const lang = rnd() < 0.7 ? "en" : pick(LANGS);

  const estDownloads = Math.round(ratingCount / RATINGS_PER_DL[store]);
  const months = monthsLive(releasedAt);
  let estMrr = 0;
  if (price > 0) estMrr = Math.round((estDownloads / months) * price * 0.7);
  else if (hasIap) estMrr = Math.round(estDownloads * 0.022 * 0.35 * 9.5 * 0.7);
  const estRevenue = estMrr * months;

  apps.push({
    id, store, store_id: storeId, bundle_id: store === "android" ? storeId : `com.${title.replace(/\W/g, "").toLowerCase()}`,
    title, subtitle: `${category} that actually sticks`,
    description: `${title} helps people make progress in ${category.toLowerCase()} without the busywork. Sample record generated for local development.`,
    developer: pick(DEVS), developer_id: null, developer_url: null,
    icon_url: null, store_url: null,
    category, categories_json: JSON.stringify([category]),
    price, currency: "USD", has_iap: hasIap ? 1 : 0,
    content_rating: pick(["4+", "9+", "12+", "17+"]),
    primary_language: lang, languages_json: JSON.stringify([lang, "en"].filter((v, idx, a) => a.indexOf(v) === idx)),
    rating: Number((3.2 + rnd() * 1.8).toFixed(2)), rating_count: ratingCount,
    version: `${between(1, 9)}.${between(0, 20)}.${between(0, 9)}`,
    size_bytes: between(20, 400) * 1024 * 1024,
    released_at: releasedAt, updated_at: updatedAt,
    // Store screenshots we cannot fetch offline; the generated screens stand in so
    // the gallery has something real to show.
    screenshots_json: JSON.stringify(
      Array.from({ length: between(3, 6) }, () => screenUrl(pick(SCREEN_TYPES))),
    ),
    est_downloads: estDownloads, est_revenue: estRevenue, est_mrr: estMrr,
    is_game: isGame ? 1 : 0, fetched_at: new Date().toISOString(),
  });
}

const insertApp = db.prepare(`INSERT OR REPLACE INTO apps (
  id, store, store_id, bundle_id, title, subtitle, description, developer, developer_id,
  developer_url, icon_url, store_url, category, categories_json, price, currency, has_iap,
  content_rating, primary_language, languages_json, rating, rating_count, version, size_bytes,
  released_at, updated_at, screenshots_json, est_downloads, est_revenue, est_mrr, is_game, fetched_at
) VALUES (
  @id, @store, @store_id, @bundle_id, @title, @subtitle, @description, @developer, @developer_id,
  @developer_url, @icon_url, @store_url, @category, @categories_json, @price, @currency, @has_iap,
  @content_rating, @primary_language, @languages_json, @rating, @rating_count, @version, @size_bytes,
  @released_at, @updated_at, @screenshots_json, @est_downloads, @est_revenue, @est_mrr, @is_game, @fetched_at
)`);

const insertCreative = db.prepare(`INSERT OR REPLACE INTO creatives
  (id, app_id, network, kind, headline, body, cta, media_url, thumb_url, landing_url, first_seen, last_seen, days_running, countries_json)
  VALUES (@id, @app_id, @network, @kind, @headline, @body, @cta, @media_url, @thumb_url, @landing_url, @first_seen, @last_seen, @days_running, @countries_json)`);

const insertOrganic = db.prepare(`INSERT OR REPLACE INTO organic_posts
  (id, app_id, platform, author, author_followers, caption, post_url, thumb_url, media_url, views, likes, comments, posted_at)
  VALUES (@id, @app_id, @platform, @author, @author_followers, @caption, @post_url, @thumb_url, @media_url, @views, @likes, @comments, @posted_at)`);

const insertFlow = db.prepare(`INSERT OR REPLACE INTO flows (id, app_id, kind, title, captured_at) VALUES (@id, @app_id, @kind, @title, @captured_at)`);
const insertScreen = db.prepare(`INSERT OR REPLACE INTO flow_screens (id, flow_id, position, screen_type, image_url, note) VALUES (@id, @flow_id, @position, @screen_type, @image_url, @note)`);
const insertReview = db.prepare(`INSERT OR REPLACE INTO reviews (id, app_id, author, rating, title, body, version, country, posted_at, sentiment, topics_json) VALUES (@id, @app_id, @author, @rating, @title, @body, @version, @country, @posted_at, @sentiment, @topics_json)`);
const insertRanking = db.prepare(`INSERT OR REPLACE INTO rankings (store, chart, country, category, position, app_id, day) VALUES (@store, @chart, @country, @category, @position, @app_id, @day)`);
const insertMetric = db.prepare(`INSERT OR REPLACE INTO app_metrics (app_id, day, rating, rating_count, rank, est_downloads, est_revenue) VALUES (@app_id, @day, @rating, @rating_count, @rank, @est_downloads, @est_revenue)`);

const today = new Date().toISOString().slice(0, 10);

db.transaction(() => {
  db.exec("DELETE FROM apps");

  for (const app of apps) {
    insertApp.run(app);

    // 90 days of history, walking backwards from today's figures. Daily values
    // carry a growth trend, weekend seasonality and noise — a flat line would
    // make the trend charts unreadable and would not resemble real store data.
    let ratingCount = app.rating_count;
    const dailyDownloads = app.est_downloads / Math.max(1, monthsLive(app.released_at) * 30.44);
    const dailyRevenue = app.est_mrr / 30.44;
    const drift = 0.994 + rnd() * 0.012; // <1 shrinking, >1 growing
    const weekendLift = 0.85 + rnd() * 0.4;
    let rank = between(1, 320);

    for (let d = 0; d < 90; d++) {
      const date = new Date(Date.now() - d * 86400000);
      const day = date.toISOString().slice(0, 10);
      const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
      const trend = drift ** d; // d counts backwards, so this walks into the past
      const season = isWeekend ? weekendLift : 1;
      const noise = 0.82 + rnd() * 0.36;
      const shape = (trend === 0 ? 1 : 1 / trend) * season * noise;

      insertMetric.run({
        app_id: app.id, day, rating: app.rating, rating_count: Math.max(0, Math.round(ratingCount)),
        rank,
        est_downloads: Math.max(0, Math.round(dailyDownloads * shape)),
        est_revenue: Math.max(0, Math.round(dailyRevenue * shape)),
      });
      ratingCount *= 1 - (0.002 + rnd() * 0.01);
      // Walk the rank a few places per day so the history reads as movement.
      rank = Math.max(1, Math.min(400, rank + Math.round((rnd() - 0.5) * 14)));
    }

    if (rnd() < 0.45) {
      const n = between(1, 6);
      for (let k = 0; k < n; k++) {
        const first = between(5, 300);
        // Poster and clip must be the same take, or the frame jumps on play.
        const clip = pick(CLIPS);
        insertCreative.run({
          id: `${app.id}:ad:${k}`, app_id: app.id, network: "meta",
          kind: rnd() < 0.7 ? "video" : "image",
          headline: `${app.title} — ${pick(["stop guessing", "in 5 minutes a day", "made simple", "your new routine"])}`,
          body: `People switching to ${app.title} report progress in the first week.`,
          cta: pick(CTAS),
          media_url: clipUrl(clip, "mp4"),
          thumb_url: clipUrl(clip, "jpg"),
          landing_url: null,
          first_seen: new Date(Date.now() - first * 86400000).toISOString(),
          last_seen: new Date(Date.now() - between(0, 4) * 86400000).toISOString(),
          days_running: first, countries_json: JSON.stringify([pick(COUNTRIES), pick(COUNTRIES)]),
        });
      }
    }

    if (rnd() < 0.4) {
      const n = between(1, 5);
      for (let k = 0; k < n; k++) {
        const views = between(4000, 3_000_000);
        const clip = pick(CLIPS);
        insertOrganic.run({
          id: `${app.id}:org:${k}`, app_id: app.id, platform: pick(PLATFORMS),
          author: `@${pick(NOUN).toLowerCase()}${between(10, 99)}`,
          author_followers: between(1200, 900_000),
          caption: `How I use ${app.title} every morning`,
          post_url: null,
          thumb_url: clipUrl(clip, "jpg"),
          media_url: clipUrl(clip, "mp4"),
          views, likes: Math.round(views * (0.03 + rnd() * 0.09)),
          comments: Math.round(views * (0.001 + rnd() * 0.004)),
          posted_at: new Date(Date.now() - between(1, 400) * 86400000).toISOString(),
        });
      }
    }

    if (rnd() < 0.35) {
      const flowId = `${app.id}:flow`;
      const kind = rnd() < 0.75 ? "onboarding" : "web-funnel";
      insertFlow.run({ id: flowId, app_id: app.id, kind, title: `${app.title} ${kind}`, captured_at: new Date().toISOString() });
      const steps = between(4, 12);
      for (let s = 0; s < steps; s++) {
        const screenType = s === 0 ? "Welcome" : s === steps - 1 ? "Paywall" : pick(SCREEN_TYPES);
        insertScreen.run({
          id: `${flowId}:${s}`, flow_id: flowId, position: s,
          screen_type: screenType,
          image_url: screenUrl(screenType),
          note: null,
        });
      }
    }

    const reviewCount = between(0, 12);
    for (let r = 0; r < reviewCount; r++) {
      const rating = between(1, 5);
      insertReview.run({
        id: `${app.id}:rev:${r}`, app_id: app.id,
        author: `${pick(NOUN).toLowerCase()}_${between(100, 999)}`,
        rating,
        title: rating >= 4 ? "Worth it" : rating === 3 ? "Decent, but" : "Not for me",
        body: rating >= 4
          ? `${app.title} finally made this stick for me. The daily view is the part I use most.`
          : `${app.title} is fine but the ${pick(["paywall", "sync", "notifications", "widget"])} gets in the way.`,
        version: app.version, country: pick(COUNTRIES),
        posted_at: new Date(Date.now() - between(1, 365) * 86400000).toISOString(),
        sentiment: rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative",
        topics_json: JSON.stringify([pick(["pricing", "performance", "design", "bugs", "support"])]),
      });
    }
  }

  // Charts per store/chart/country. Each country gets its own deterministic
  // affinity per app, so the same global ordering does not repeat everywhere —
  // a country comparison where every row is identical tells the reader nothing.
  const affinity = (appId, country) => {
    let h = 2166136261;
    for (const ch of `${appId}:${country}`) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    // 0.55x to 1.45x: enough to reshuffle the order without inventing a
    // different catalogue per country.
    return 0.55 + ((h >>> 0) % 1000) / 1000 * 0.9;
  };

  for (const store of ["ios", "android"]) {
    const pool = apps.filter((a) => a.store === store);
    for (const chart of ["free", "paid", "grossing"]) {
      const eligible = pool.filter((a) =>
        chart === "paid" ? a.price > 0 : chart === "free" ? a.price === 0 : true,
      );
      for (const country of COUNTRIES) {
        const ranked = eligible
          .map((a) => ({
            app: a,
            score: (chart === "grossing" ? a.est_mrr : a.est_downloads) * affinity(a.id, country),
          }))
          .sort((x, y) => y.score - x.score)
          .slice(0, 50);
        ranked.forEach(({ app }, idx) =>
          insertRanking.run({ store, chart, country, category: "all", position: idx + 1, app_id: app.id, day: today }),
        );
      }
    }
  }
})();

const n = (t) => db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
console.log(
  `seeded: apps=${n("apps")} creatives=${n("creatives")} organic=${n("organic_posts")} ` +
  `flows=${n("flows")} screens=${n("flow_screens")} reviews=${n("reviews")} ` +
  `rankings=${n("rankings")} metrics=${n("app_metrics")}`,
);
