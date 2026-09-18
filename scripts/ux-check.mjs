/**
 * Interaction checks: the parts that compile fine and are still broken in use —
 * keyboard entry points, sorting, clearing filters, and focus visibility.
 */
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const results = [];
const check = (name, passed, detail = "") => {
  results.push(passed);
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });

await page.goto(`${BASE}/dashboard/apps`, { waitUntil: "load" });
await page.waitForSelector("table");

// Command palette opens on the keyboard shortcut.
await page.keyboard.press("Control+k");
await page.waitForTimeout(300);
const dialog = page.getByRole("dialog", { name: "Command palette" });
check("Ctrl+K opens the command palette", await dialog.isVisible());

// It searches the catalogue, not just the menu.
await page.keyboard.type("bud");
await page.waitForTimeout(700);
const rowCount = await dialog.locator("li button").count();
const firstLabel = await dialog.locator("li button").first().textContent();
check("palette searches apps", rowCount > 0, `${rowCount} results, first "${firstLabel?.trim()}"`);

// Enter follows the highlighted result.
await page.keyboard.press("Enter");
await page.waitForTimeout(1200);
check("Enter navigates to the result", !page.url().includes("/dashboard/apps?"), page.url().replace(BASE, ""));

// Escape closes it.
await page.goto(`${BASE}/dashboard/apps`, { waitUntil: "load" });
await page.keyboard.press("Control+k");
await page.waitForTimeout(250);
await page.keyboard.press("Escape");
await page.waitForTimeout(250);
check("Escape closes the palette", !(await dialog.isVisible().catch(() => false)));

// Column headers sort, and say which way.
await page.waitForSelector("table");
const ratingHeader = page.getByRole("button", { name: /Rating/ }).first();
await ratingHeader.click();
await page.waitForTimeout(1200);
check("clicking a column header sorts", page.url().includes("sort=rating"), page.url().split("?")[1] ?? "");
const ariaSort = await page.locator("th", { has: page.getByRole("button", { name: /Rating/ }) }).first().getAttribute("aria-sort");
check("sorted column exposes aria-sort", ariaSort === "descending" || ariaSort === "ascending", String(ariaSort));

// Clearing filters is reachable in one click.
await page.goto(`${BASE}/dashboard/apps?minRating=4&signal=ads`, { waitUntil: "load" });
await page.waitForSelector("table");
const clear = page.getByRole("button", { name: /Clear \d+ filters?/ });
check("clear-all button appears with active filters", await clear.isVisible());
await clear.click();
await page.waitForTimeout(1200);
check("clear-all removes every filter", !page.url().includes("minRating"), page.url().replace(BASE, ""));

// Keyboard focus is visible. Wait for the clear-all navigation to settle first:
// pressing keys mid-navigation destroys the execution context and the whole run
// dies rather than reporting a failed check.
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForSelector("table");
await page.keyboard.press("Tab");
await page.keyboard.press("Tab");
const outline = await page.evaluate(() => {
  const el = document.activeElement;
  if (!el) return null;
  const s = getComputedStyle(el);
  return { tag: el.tagName, outlineWidth: s.outlineWidth, outlineStyle: s.outlineStyle };
});
check(
  "focused element has a visible outline",
  Boolean(outline && outline.outlineStyle !== "none" && parseFloat(outline.outlineWidth) > 0),
  JSON.stringify(outline),
);

await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} interaction checks passed`);
process.exit(failed === 0 ? 0 : 1);
