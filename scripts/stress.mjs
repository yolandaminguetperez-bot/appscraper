/**
 * Load test against a running production build.
 *
 * Drives a realistic mix of pages and API calls at a fixed concurrency for a
 * fixed duration, and reports per-route latency percentiles and error counts.
 * Percentiles, not averages: an average hides the slow tail that users feel.
 *
 * Usage: node scripts/stress.mjs [--concurrency 32] [--seconds 20] [--base URL]
 */
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith("--")) pairs.push([arg.slice(2), all[i + 1]]);
    return pairs;
  }, []),
);

const BASE = args.base ?? "http://localhost:3000";
const CONCURRENCY = Number(args.concurrency ?? 32);
const SECONDS = Number(args.seconds ?? 20);

// Weighted so the heavy, most-visited views dominate, as real traffic would.
const ROUTES = [
  { path: "/dashboard/apps", weight: 6, kind: "page" },
  { path: "/dashboard/apps?minRating=4&signal=ads&sort=downloads", weight: 4, kind: "page" },
  { path: "/dashboard/overview", weight: 3, kind: "page" },
  { path: "/dashboard/ads", weight: 3, kind: "page" },
  { path: "/dashboard/ads?view=ads", weight: 2, kind: "page" },
  { path: "/dashboard/organic", weight: 2, kind: "page" },
  { path: "/dashboard/onboardings", weight: 2, kind: "page" },
  { path: "/dashboard/trending", weight: 2, kind: "page" },
  { path: "/dashboard/rankings?chart=grossing", weight: 2, kind: "page" },
  { path: "/dashboard/reviews", weight: 2, kind: "page" },
  { path: "/dashboard/keywords?term=budget", weight: 1, kind: "page" },
  { path: "/dashboard/apps/android%3Acom.cobalt.notes7889", weight: 2, kind: "page" },
  { path: "/api/v1/apps?perPage=50", weight: 4, kind: "api" },
  { path: "/api/v1/apps?store=ios&minRevenue=100000&sort=revenue", weight: 3, kind: "api" },
  { path: "/api/v1/rankings?chart=grossing&limit=50", weight: 2, kind: "api" },
  { path: "/api/v1/reviews?sentiment=negative", weight: 2, kind: "api" },
  { path: "/api/v1/keywords?term=habit", weight: 1, kind: "api" },
  { path: "/api/apps/export?store=ios&minReviews=1000", weight: 1, kind: "export" },
];

const pool = ROUTES.flatMap((route) => Array(route.weight).fill(route));
const stats = new Map();

function record(route, ms, status) {
  const entry = stats.get(route.path) ?? { kind: route.kind, times: [], ok: 0, failed: 0, statuses: {} };
  entry.times.push(ms);
  entry.statuses[status] = (entry.statuses[status] ?? 0) + 1;
  if (status >= 200 && status < 400) entry.ok += 1;
  else entry.failed += 1;
  stats.set(route.path, entry);
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
}

const deadline = Date.now() + SECONDS * 1000;
let inflightPeak = 0;
let inflight = 0;

async function worker() {
  while (Date.now() < deadline) {
    const route = pool[Math.floor(Math.random() * pool.length)];
    const started = performance.now();
    inflight += 1;
    inflightPeak = Math.max(inflightPeak, inflight);

    try {
      const res = await fetch(BASE + route.path, { headers: { "cache-control": "no-cache" } });
      // Drain the body: without it the socket stays busy and timings lie.
      await res.arrayBuffer();
      record(route, performance.now() - started, res.status);
    } catch (error) {
      record(route, performance.now() - started, error?.cause?.code ?? "NETWORK");
    } finally {
      inflight -= 1;
    }
  }
}

console.log(`Load: ${CONCURRENCY} concurrent · ${SECONDS}s · ${BASE}\n`);
const wallStart = performance.now();
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
const wallSeconds = (performance.now() - wallStart) / 1000;

let totalRequests = 0;
let totalFailed = 0;
const rows = [];

for (const [path, entry] of stats) {
  const sorted = [...entry.times].sort((a, b) => a - b);
  totalRequests += sorted.length;
  totalFailed += entry.failed;
  rows.push({
    route: path.length > 46 ? `${path.slice(0, 43)}...` : path,
    kind: entry.kind,
    n: sorted.length,
    p50: Math.round(percentile(sorted, 50)),
    p95: Math.round(percentile(sorted, 95)),
    p99: Math.round(percentile(sorted, 99)),
    max: Math.round(sorted[sorted.length - 1] ?? 0),
    failed: entry.failed,
    statuses: Object.entries(entry.statuses).map(([s, n]) => `${s}:${n}`).join(" "),
  });
}

rows.sort((a, b) => b.p95 - a.p95);
console.table(rows);

const allTimes = [...stats.values()].flatMap((e) => e.times).sort((a, b) => a - b);
console.log(
  [
    `requests      ${totalRequests}`,
    `throughput    ${(totalRequests / wallSeconds).toFixed(1)} req/s`,
    `failed        ${totalFailed} (${((totalFailed / totalRequests) * 100).toFixed(2)}%)`,
    `latency p50   ${Math.round(percentile(allTimes, 50))} ms`,
    `latency p95   ${Math.round(percentile(allTimes, 95))} ms`,
    `latency p99   ${Math.round(percentile(allTimes, 99))} ms`,
    `latency max   ${Math.round(allTimes[allTimes.length - 1] ?? 0)} ms`,
    `peak inflight ${inflightPeak}`,
  ].join("\n"),
);

process.exit(totalFailed > 0 ? 1 : 0);
