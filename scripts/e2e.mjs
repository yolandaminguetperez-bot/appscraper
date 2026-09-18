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

// Clicking a country on the ads map filters to it, and the two views scope that
// filter differently: apps that run *something* there vs creatives that run there.
{
  const inJp = db
    .prepare("SELECT COUNT(*) AS creatives FROM creatives WHERE countries_json LIKE '%\"jp\"%'")
    .get().creatives;
  const appsInJp = db
    .prepare("SELECT COUNT(DISTINCT app_id) AS apps FROM creatives WHERE countries_json LIKE '%\"jp\"%'")
    .get().apps;

  const countOn = async (url) => {
    await page.goto(BASE + url, { waitUntil: "load" });
    const text = await page.textContent("body");
    return Number((text.match(/([\d,]+) results/) ?? [])[1]?.replace(/,/g, "") ?? -1);
  };

  check(
    "country filter scopes creatives to that country",
    (await countOn("/dashboard/ads?view=ads&country=jp")) === inJp,
    `expected ${inJp}`,
  );
  check(
    "country filter scopes the grouped view to apps running there",
    (await countOn("/dashboard/ads?country=jp")) === appsInJp,
    `expected ${appsInJp}`,
  );
}

// A selection survives navigation and hands the compare page the parameter it
// actually reads — `app`, not `ids`, which renders an empty comparison.
{
  await page.goto(`${BASE}/dashboard/apps`, { waitUntil: "load" });
  for (const index of [0, 1]) await page.getByRole("checkbox").nth(index).click();
  await page.waitForTimeout(300);

  await page.goto(`${BASE}/dashboard/apps?page=2`, { waitUntil: "load" });
  const carried = (await page.textContent("body")).match(/(\d+) selected/)?.[1];
  check("selection survives navigation", carried === "2", `${carried} selected on page 2`);

  await page.getByRole("link", { name: "Compare", exact: true }).click();
  await page.waitForTimeout(1200);
  const comparing = await page.textContent("body");
  check(
    "compare opens with the selected apps",
    page.url().includes("app=") && comparing.includes("Lifetime revenue"),
    page.url().slice(-60),
  );

  await page.goto(`${BASE}/dashboard/apps`, { waitUntil: "load" });
  await page.getByLabel("Clear selection").click();
  await page.waitForTimeout(300);
  check(
    "clearing removes the selection bar",
    !(await page.textContent("body")).includes(" selected"),
    "",
  );
}

// Quick look opens over the list, shows that app's numbers, and leaves the URL
// (and so the filters and scroll position) alone.
{
  await page.goto(`${BASE}/dashboard/apps`, { waitUntil: "load" });
  const trigger = page.getByLabel(/Quick look at/).first();
  const name = (await trigger.getAttribute("aria-label")).replace("Quick look at ", "");
  await trigger.click();
  await page.waitForSelector("[role=dialog]");
  await page.waitForTimeout(1200);
  const panel = await page.locator("[role=dialog]").textContent();
  check(
    "quick look shows the app without navigating",
    panel.includes(name) && panel.includes("MRR") && page.url().endsWith("/dashboard/apps"),
    name,
  );

  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  check("escape closes quick look", (await page.locator("[role=dialog]").count()) === 0, "");
}

// The map has a real hover tooltip, not the browser's one-second <title>.
{
  await page.goto(`${BASE}/dashboard/rankings`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  const shape = page.locator('svg a[href*="country="] path').first();
  const box = await shape.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  const tip = await page.locator("[role=status]").count();
  check("map shows a tooltip on hover", tip === 1, await page.locator("[role=status]").first().textContent());

  await page.mouse.move(5, 5);
  await page.waitForTimeout(300);
  check("map tooltip clears on leave", (await page.locator("[role=status]").count()) === 0, "");
}

// The quick-look panel is where you decide about an app, so its buttons must
// write through, not just light up.
{
  db.prepare("DELETE FROM favorites").run();
  db.prepare("DELETE FROM tracked_apps").run();

  await page.goto(`${BASE}/dashboard/apps`, { waitUntil: "load" });
  await page.getByLabel(/Quick look at/).first().click();
  await page.waitForSelector("[role=dialog]");
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Track as competitor" }).click();
  await page.waitForTimeout(1000);

  const saved = db.prepare("SELECT ref_id FROM favorites").all();
  const tracked = db.prepare("SELECT app_id, role FROM tracked_apps").all();
  check(
    "quick look save and track write to the database",
    saved.length === 1 && tracked.length === 1 && tracked[0].role === "competitor",
    JSON.stringify({ saved, tracked }),
  );

  const state = await (await page.request.get(`${BASE}/api/app-state/${encodeURIComponent(saved[0].ref_id)}`)).json();
  check(
    "reopening reflects the stored state",
    state.favorite === true && state.role === "competitor",
    JSON.stringify(state),
  );
}

// Search positions and market splits are real rows, and the rank move is
// reported the way a reader means it: climbing is positive.
{
  const tracked = db
    .prepare("SELECT app_id FROM keyword_ranks GROUP BY app_id ORDER BY COUNT(*) DESC LIMIT 1")
    .get().app_id;

  const shares = db
    .prepare("SELECT SUM(share) AS total FROM app_countries WHERE app_id = ?")
    .get(tracked).total;
  // Regression: keywords are shared between competing apps, and seeding them
  // with INSERT OR REPLACE cascaded into keyword_ranks and deleted the
  // positions already written. 353 of 420 apps lost their history and the
  // table still looked populated, so coverage is what this asserts.
  const covered = db.prepare("SELECT COUNT(DISTINCT app_id) AS n FROM keyword_ranks").get().n;
  const totalApps = db.prepare("SELECT COUNT(*) AS n FROM apps").get().n;
  check(
    "every app kept its search positions",
    covered === totalApps,
    `${covered} of ${totalApps} apps`,
  );

  check(
    "country shares of one app sum to 1",
    Math.abs(shares - 1) < 0.001,
    String(shares),
  );

  await page.goto(`${BASE}/dashboard/apps/${encodeURIComponent(tracked)}`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  const body = await page.textContent("body");
  check(
    "app page shows search rankings and markets",
    body.includes("Search rankings") && body.includes("Where the money comes from"),
    tracked,
  );

  const term = db
    .prepare(
      `SELECT k.term FROM keyword_ranks r JOIN keywords k ON k.id = r.keyword_id
       WHERE r.app_id = ? LIMIT 1`,
    )
    .get(tracked).term;
  await page.goto(`${BASE}/dashboard/keywords?term=${encodeURIComponent(term)}`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  check(
    "keyword explorer ranks by real position",
    (await page.textContent("body")).includes("Ranking for"),
    term,
  );
}

// Alerts: a rule set from an app page is evaluated against real history, shows
// in the sidebar, and disappears when deleted.
{
  db.prepare("DELETE FROM alerts").run();

  const app = db.prepare("SELECT id, title FROM apps ORDER BY est_revenue DESC LIMIT 1").get();
  await page.goto(`${BASE}/dashboard/apps/${encodeURIComponent(app.id)}`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Alert me" }).click();
  await page.getByRole("button", { name: "Create alert" }).click();
  await page.waitForTimeout(1200);

  const stored = db.prepare("SELECT app_id, metric, threshold FROM alerts").all();
  check(
    "alert rule is stored from the app page",
    stored.length === 1 && stored[0].app_id === app.id,
    JSON.stringify(stored),
  );

  await page.goto(`${BASE}/dashboard/alerts`, { waitUntil: "load" });
  await page.waitForTimeout(700);
  const listed = await page.textContent("body");
  check(
    "alerts page reports the rule against real history",
    /\d+ of 1 firing right now/.test(listed) && listed.includes(app.title),
    (listed.match(/\d+ of \d+ firing right now/) ?? ["?"])[0],
  );

  await page.getByLabel(/Delete alert/).first().click();
  await page.waitForTimeout(1200);
  check(
    "deleting the rule removes it",
    db.prepare("SELECT COUNT(*) AS n FROM alerts").get().n === 0,
    "",
  );
}

// Chart movement needs more than one day of chart to exist at all.
{
  const days = db
    .prepare("SELECT COUNT(DISTINCT day) AS n FROM rankings WHERE store='ios' AND chart='free' AND country='us'")
    .get().n;
  check("the chart has history to compare against", days > 1, `${days} days stored`);

  await page.goto(`${BASE}/dashboard/rankings`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  const body = await page.textContent("body");
  check(
    "rankings report what moved",
    ["Climbing", "Falling", "New on the chart", "Dropped out"].every((panel) => body.includes(panel)),
    "",
  );
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
