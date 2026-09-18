/**
 * Fills in real store artwork for apps that have no icon_url yet.
 *
 * Every view already prefers a real icon and only draws a generated mark when
 * there is none, so running this is all it takes for the originals to appear
 * everywhere. It is a separate script rather than part of the refresh job
 * because it is the one piece that cannot run in a sandbox with the store CDNs
 * blocked, and you want to see plainly whether it worked.
 *
 *   node scripts/backfill-icons.mjs            # every app missing an icon
 *   node scripts/backfill-icons.mjs --limit 50
 *   node scripts/backfill-icons.mjs --check    # only report reachability
 *
 * iOS artwork comes from the iTunes lookup API. Google Play has no such API, so
 * the detail page is parsed — the same path the Play adapter already uses.
 */
import Database from "better-sqlite3";

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1]) || 0;
const checkOnly = args.includes("--check");

const db = new Database(process.env.APPSCRAPER_DB ?? "data/appscraper.db");

async function reachable(url) {
  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(12_000) });
    return { ok: res.ok, status: res.status };
  } catch (error) {
    return { ok: false, status: String(error?.cause?.code ?? error?.name ?? error) };
  }
}

const probes = [
  ["iTunes lookup API", "https://itunes.apple.com/lookup?id=284882215"],
  ["Apple artwork CDN", "https://is1-ssl.mzstatic.com/"],
  ["Play store page", "https://play.google.com/store/apps/details?id=com.whatsapp&hl=en"],
  ["Play artwork CDN", "https://play-lh.googleusercontent.com/"],
];

console.log("Reachability:");
let anyReachable = false;
for (const [name, url] of probes) {
  const result = await reachable(url);
  if (result.ok) anyReachable = true;
  console.log(`  ${result.ok ? "ok  " : "FAIL"}  ${name.padEnd(20)} ${result.status}`);
}

if (checkOnly) process.exit(anyReachable ? 0 : 1);

if (!anyReachable) {
  console.error(
    "\nNo store host is reachable from here, so no original artwork can be fetched.\n" +
      "Run this where those hosts are allowed; the app picks the real icons up with no other change.",
  );
  process.exit(1);
}

const rows = db
  .prepare(
    `SELECT id, store, store_id FROM apps
     WHERE icon_url IS NULL OR icon_url = ''
     ORDER BY est_revenue DESC${limit ? " LIMIT ?" : ""}`,
  )
  .all(...(limit ? [limit] : []));

console.log(`\n${rows.length} apps without artwork.`);

const update = db.prepare("UPDATE apps SET icon_url = ? WHERE id = ?");
let filled = 0;
let missed = 0;

async function iosIcon(storeId) {
  const res = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(storeId)}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const body = await res.json();
  const first = body.results?.[0];
  return first?.artworkUrl512 ?? first?.artworkUrl100 ?? null;
}

async function androidIcon(storeId) {
  const res = await fetch(
    `https://play.google.com/store/apps/details?id=${encodeURIComponent(storeId)}&hl=en&gl=us`,
    { signal: AbortSignal.timeout(15_000) },
  );
  if (!res.ok) return null;
  const html = await res.text();
  // The icon is the page's og:image; parsing the embedded JSON for it is far
  // more brittle and this is the same URL.
  return html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? null;
}

for (const row of rows) {
  try {
    const icon = row.store === "ios" ? await iosIcon(row.store_id) : await androidIcon(row.store_id);
    if (icon) {
      update.run(icon, row.id);
      filled += 1;
    } else {
      missed += 1;
    }
  } catch {
    missed += 1;
  }
  // The stores throttle; this is a backfill, not a race.
  await new Promise((resolve) => setTimeout(resolve, 250));
}

console.log(`filled=${filled} missed=${missed}`);
