/** Captures key views in dark mode, so the dark steps get looked at, not assumed. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOT_BASE ?? "http://localhost:3000";
mkdirSync("shots", { recursive: true });

const views = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["/dashboard/overview", "/dashboard/apps", "/dashboard/ads"];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });

await page.addInitScript(() => {
  try {
    localStorage.setItem("theme", "dark");
  } catch {}
});

for (const path of views) {
  await page.goto(BASE + path, { waitUntil: "load" });
  await page
    .waitForFunction(() => !document.querySelector("main .animate-pulse"), null, { timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(600);

  const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  const name = `dark-${path.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home"}`;
  await page.screenshot({ path: `shots/${name}.png` });
  console.log(`captured ${name} (data-theme=${theme})`);
}

await browser.close();
