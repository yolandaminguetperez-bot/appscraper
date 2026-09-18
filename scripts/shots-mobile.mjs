/** Phone-width captures, to check the drawer and layout at 390px. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOT_BASE ?? "http://localhost:3000";
mkdirSync("shots", { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

await page.goto(`${BASE}/dashboard/apps`, { waitUntil: "load" });
await page
  .waitForFunction(() => !document.querySelector("main .animate-pulse"), null, { timeout: 15000 })
  .catch(() => {});
await page.waitForTimeout(600);
await page.screenshot({ path: "shots/mobile-apps.png" });

await page.getByLabel("Open navigation").click();
await page.waitForTimeout(400);
await page.screenshot({ path: "shots/mobile-drawer.png" });

// The page must not scroll sideways at phone width.
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
console.log("horizontal overflow (px):", overflow);

await browser.close();
process.exit(overflow > 2 ? 1 : 0);
