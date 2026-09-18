/** Captures the dashboard views to shots/ so progress can be reviewed without running the app. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOT_BASE ?? "http://localhost:3000";
const OUT = process.env.SHOT_OUT ?? "shots";
const views = process.argv.slice(2).length
  ? process.argv.slice(2).map((p) => ({ name: p.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home", path: p }))
  : [
      { name: "apps", path: "/dashboard/apps" },
      { name: "apps-filtered", path: "/dashboard/apps?released=90&signal=ads&minRating=4&sort=downloads" },
    ];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });

for (const view of views) {
  await page.goto(BASE + view.path, { waitUntil: "load" });
  await page.screenshot({ path: `${OUT}/${view.name}.png`, fullPage: false });
  console.log(`captured ${view.name} <- ${view.path}`);
}

await browser.close();
