/**
 * End-to-end checks against a running server (npm run start).
 * Exercises the paths that only fail at runtime: server actions writing to SQLite,
 * filters changing result sets, and every dashboard route rendering without error.
 */
import { chromium } from "playwright";
import Database from "better-sqlite3";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const db = new Database(process.env.APPSCRAPER_DB ?? "data/appscraper.db");

const results = [];
const check = (name, passed, detail = "") => {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const serverErrors = [];
page.on("response", (res) => {
  if (res.status() >= 500) serverErrors.push(`${res.status()} ${res.url()}`);
});

// Every dashboard route renders.
const routes = [
  "/dashboard/overview",
  "/dashboard/apps",
  "/dashboard/developers/Ninefold",
  "/dashboard/ads",
  "/dashboard/ads?view=ads",
  "/dashboard/organic",
  "/dashboard/onboardings",
  "/dashboard/trending",
  "/dashboard/rising",
  "/dashboard/rankings",
  "/dashboard/favorites",
  "/dashboard/favorites/apps",
  "/dashboard/favorites/ads",
  "/dashboard/favorites/organic",
  "/dashboard/keywords",
  "/dashboard/keywords?term=budget",
  "/dashboard/your-apps/new",
  "/dashboard/your-apps",
  "/dashboard/reviews",
  "/dashboard/competitors",
  "/dashboard/compare",
  "/dashboard/mcp",
  "/dashboard/api",
];

for (const route of routes) {
  const res = await page.goto(BASE + route, { waitUntil: "load" });
  const body = await page.textContent("body");
  const ok = res?.ok() && !body.includes("Application error");
  check(`renders ${route}`, Boolean(ok), ok ? "" : `status ${res?.status()}`);
}

// Favoriting writes through to the database and shows up on the favorites page.
db.prepare("DELETE FROM favorites").run();
await page.goto(`${BASE}/dashboard/apps`, { waitUntil: "load" });
await page.getByLabel("Save to favorites").first().click();
await page.waitForTimeout(1200);
const saved = db.prepare("SELECT kind, ref_id FROM favorites").all();
check("favoriting an app writes to the database", saved.length === 1, JSON.stringify(saved));
const savedTitle = saved[0]
  ? db.prepare("SELECT title FROM apps WHERE id = ?").get(saved[0].ref_id)?.title
  : null;

await page.goto(`${BASE}/dashboard/favorites/apps`, { waitUntil: "load" });
// Assert the app is on the page, not that it sits in a particular element:
// the row-count assertion broke the moment the view became a card grid, while
// the feature itself was fine.
const favShown = savedTitle
  ? await page.getByText(savedTitle, { exact: false }).first().isVisible().catch(() => false)
  : false;
check("saved app appears on the favorites page", favShown, savedTitle ?? "no title");

// Filters actually narrow the result set.
await page.goto(`${BASE}/dashboard/apps`, { waitUntil: "load" });
const allText = await page.textContent("body");
const allCount = Number((allText.match(/([\d,]+) results/) ?? [])[1]?.replace(/,/g, "") ?? 0);
await page.goto(`${BASE}/dashboard/apps?minRating=4&signal=ads`, { waitUntil: "load" });
const filteredText = await page.textContent("body");
const filteredCount = Number((filteredText.match(/([\d,]+) results/) ?? [])[1]?.replace(/,/g, "") ?? 0);
check(
  "filters narrow the result set",
  allCount > 0 && filteredCount > 0 && filteredCount < allCount,
  `${allCount} -> ${filteredCount}`,
);

// Tracking an app writes through and shows on Your Apps.
db.prepare("DELETE FROM tracked_apps").run();
await page.goto(`${BASE}/dashboard/your-apps/new?q=budget`, { waitUntil: "load" });
await page.getByRole("button", { name: "Add app" }).first().click();
await page.waitForTimeout(1200);
const tracked = db.prepare("SELECT app_id, role FROM tracked_apps").all();
check("adding an app writes to tracked_apps", tracked.length === 1, JSON.stringify(tracked));
const trackedTitle = tracked[0]
  ? db.prepare("SELECT title FROM apps WHERE id = ?").get(tracked[0].app_id)?.title
  : null;

await page.goto(`${BASE}/dashboard/your-apps`, { waitUntil: "load" });
const trackedShown = trackedTitle
  ? await page.getByText(trackedTitle, { exact: false }).first().isVisible().catch(() => false)
  : false;
check("tracked app appears on Your Apps", trackedShown, trackedTitle ?? "no title");

// The world map: the base image is served and cacheable, and the countries with
// data are real links rather than decoration.
{
  const svg = await page.request.get(`${BASE}/api/world-map`);
  const body = await svg.text();
  check(
    "base world map is served as a cacheable image",
    svg.ok() &&
      (svg.headers()["content-type"] ?? "").includes("image/svg+xml") &&
      (svg.headers()["cache-control"] ?? "").includes("immutable") &&
      body.split("<path").length > 100,
    `${body.split("<path").length - 1} paths`,
  );

  await page.goto(`${BASE}/dashboard/rankings`, { waitUntil: "load" });
  const links = await page.locator('svg a[href*="country="]').count();
  check("map countries link to their chart", links > 1, `${links} linked countries`);
}

// Every export endpoint returns CSV that parses back with a stable column count.
for (const [name, path] of [
  ["apps", "/api/apps/export?store=ios"],
  ["ads", "/api/ads/export?minDays=30"],
  ["organic", "/api/organic/export?platform=tiktok"],
  ["reviews", "/api/reviews/export?sentiment=negative"],
]) {
  const res = await page.request.get(BASE + path);
  const text = await res.text();
  const lines = text.split("\n").filter(Boolean);
  // A quoted field can hold a newline, so count commas outside quotes rather
  // than splitting naively — a malformed row is exactly what this guards.
  const widths = new Set(
    lines.map((line) => {
      let quoted = false;
      let cells = 1;
      for (const ch of line) {
        if (ch === '"') quoted = !quoted;
        else if (ch === "," && !quoted) cells += 1;
      }
      return cells;
    }),
  );
  check(
    `${name} export is well-formed CSV`,
    res.ok() && lines.length > 1 && widths.size === 1,
    `${lines.length} lines, widths ${[...widths].join("/")}`,
  );
}

check("no 5xx responses", serverErrors.length === 0, serverErrors.join(", "));

await browser.close();

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
