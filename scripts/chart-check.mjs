/** Verifies the trend chart's hover readout and table view against a running build. */
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const res = await fetch(`${BASE}/api/v1/apps?perPage=1&minRevenue=1000000`);
const { data } = await res.json();
const url = `${BASE}/dashboard/apps/${encodeURIComponent(data[0].id)}`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "load" });
await page.waitForSelector("svg[role=img]");

const chart = page.locator("svg[role=img]").first();
const box = await chart.boundingBox();
await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5);
await page.waitForTimeout(400);

const tooltip = await page.locator("[role=status]").first().textContent();
console.log("tooltip:", tooltip?.replace(/\s+/g, " ").trim());
await page.screenshot({ path: "shots/chart-hover.png", clip: { x: box.x - 30, y: box.y - 120, width: box.width + 80, height: box.height + 160 } });

await page.getByRole("button", { name: "Table" }).first().click();
await page.waitForTimeout(400);
const rows = await page.locator("table tbody tr").count();
console.log("table rows:", rows);

await browser.close();
if (!tooltip || rows < 80) {
  console.error("FAIL: hover readout or table view missing");
  process.exit(1);
}
console.log("PASS: chart hover and table view work");
