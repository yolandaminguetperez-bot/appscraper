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
  "/dashboard/apps",
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

await page.goto(`${BASE}/dashboard/favorites/apps`, { waitUntil: "load" });
const favRows = await page.locator("main tbody tr").count();
check("saved app appears on the favorites page", favRows === 1, `${favRows} rows`);

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

await page.goto(`${BASE}/dashboard/your-apps`, { waitUntil: "load" });
// Assert against rendered rows, not body text: RSC payload scripts carry the
// empty-state string even when the list is populated.
const trackedRows = await page.locator("main ul > li").count();
check("tracked app appears on Your Apps", trackedRows === 1, `${trackedRows} rows`);

check("no 5xx responses", serverErrors.length === 0, serverErrors.join(", "));

await browser.close();

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
