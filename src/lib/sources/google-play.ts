import { fetchText, mapLimit, SourceError } from "@/lib/sources/http";
import { withEstimates } from "@/lib/sources/estimates";
import type { App } from "@/lib/types";

const BASE = "https://play.google.com";

/**
 * Play's store pages ship their data as `AF_initDataCallback({key:'ds:N', ..., data:[...]})`
 * blobs. We pull those blobs out and read values by index path, which is how the
 * page itself addresses them.
 */
function extractDataBlobs(html: string): Map<string, unknown> {
  const blobs = new Map<string, unknown>();
  const re = /AF_initDataCallback\((\{[\s\S]*?\})\);<\/script>/g;

  for (const match of html.matchAll(re)) {
    const body = match[1];
    const keyMatch = body.match(/key:\s*'([^']+)'/);
    const dataMatch = body.match(/data:\s*(\[[\s\S]*?\])\s*,\s*sideChannel/);
    if (!keyMatch || !dataMatch) continue;
    try {
      blobs.set(keyMatch[1], JSON.parse(dataMatch[1]));
    } catch {
      // A blob we cannot parse is not fatal; other blobs may still carry what we need.
    }
  }

  return blobs;
}

function at(root: unknown, path: number[]): unknown {
  let node: unknown = root;
  for (const index of path) {
    if (!Array.isArray(node)) return undefined;
    node = node[index];
  }
  return node;
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

/** "10,000,000+" -> 10000000 */
function parseInstalls(value: unknown): number | null {
  const text = str(value);
  if (!text) return null;
  const digits = text.replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

export async function playAppDetail(
  packageName: string,
  { country = "us", lang = "en" }: { country?: string; lang?: string } = {},
): Promise<App> {
  const url = `${BASE}/store/apps/details?id=${encodeURIComponent(packageName)}&hl=${lang}&gl=${country}`;
  const html = await fetchText(url);
  const blobs = extractDataBlobs(html);
  const ds5 = blobs.get("ds:5") ?? blobs.get("ds:4");
  if (!ds5) throw new SourceError(`Could not read Play listing for ${packageName}`);

  const title = str(at(ds5, [1, 2, 0, 0])) ?? packageName;
  const description = str(at(ds5, [1, 2, 72, 0, 1]));
  const developer = str(at(ds5, [1, 2, 68, 0]));
  const developerUrl = str(at(ds5, [1, 2, 68, 1, 4, 2]));
  const iconUrl = str(at(ds5, [1, 2, 95, 0, 3, 2]));
  const category = str(at(ds5, [1, 2, 79, 0, 0, 0]));
  const rating = num(at(ds5, [1, 2, 51, 0, 1]));
  const ratingCount = num(at(ds5, [1, 2, 51, 2, 1]));
  const installs = parseInstalls(at(ds5, [1, 2, 13, 0]));
  const priceMicros = num(at(ds5, [1, 2, 57, 0, 0, 0, 0, 1, 0, 2]));
  const currency = str(at(ds5, [1, 2, 57, 0, 0, 0, 0, 1, 0, 1]));
  const hasIap = Boolean(str(at(ds5, [1, 2, 19, 0])));
  const contentRating = str(at(ds5, [1, 2, 9, 0]));
  const version = str(at(ds5, [1, 2, 140, 0, 0, 0]));
  const released = str(at(ds5, [1, 2, 10, 0]));
  const updatedEpoch = num(at(ds5, [1, 2, 145, 0, 1, 0]));

  const shotsNode = at(ds5, [1, 2, 78, 0]);
  const screenshots = Array.isArray(shotsNode)
    ? shotsNode.map((s) => str(at(s, [3, 2]))).filter((s): s is string => Boolean(s))
    : [];

  const price = priceMicros ? priceMicros / 1_000_000 : 0;

  const app: App = {
    id: `android:${packageName}`,
    store: "android",
    storeId: packageName,
    bundleId: packageName,
    title,
    subtitle: null,
    description,
    developer,
    developerId: developer,
    developerUrl,
    iconUrl,
    storeUrl: `${BASE}/store/apps/details?id=${packageName}`,
    category,
    categories: category ? [category] : [],
    price,
    currency,
    hasIap,
    contentRating,
    primaryLanguage: lang,
    languages: [lang],
    rating,
    ratingCount,
    version,
    sizeBytes: null,
    releasedAt: released ? new Date(released).toISOString() : null,
    updatedAt: updatedEpoch ? new Date(updatedEpoch * 1000).toISOString() : null,
    screenshots,
    estDownloads: installs,
    estRevenue: null,
    estMrr: null,
    isGame: Boolean(category && category.toUpperCase().startsWith("GAME")),
    fetchedAt: new Date().toISOString(),
  };

  const withEst = withEstimates(app);
  // Play publishes an install bracket; prefer it over our rating-derived guess.
  return { ...withEst, estDownloads: installs ?? withEst.estDownloads };
}

/** Pulls package names out of any Play listing page (search, charts, developer). */
function extractPackageNames(html: string, limit: number): string[] {
  const seen = new Set<string>();
  for (const match of html.matchAll(/\/store\/apps\/details\?id=([A-Za-z0-9._]+)/g)) {
    seen.add(match[1]);
    if (seen.size >= limit) break;
  }
  return [...seen];
}

export async function searchGooglePlay(
  term: string,
  { country = "us", lang = "en", limit = 30 }: { country?: string; lang?: string; limit?: number } = {},
): Promise<App[]> {
  const url = `${BASE}/store/search?q=${encodeURIComponent(term)}&c=apps&hl=${lang}&gl=${country}`;
  const html = await fetchText(url);
  const packages = extractPackageNames(html, limit);

  const apps = await mapLimit(packages, 4, async (pkg) => {
    try {
      return await playAppDetail(pkg, { country, lang });
    } catch {
      return null;
    }
  });

  return apps.filter((a): a is App => Boolean(a));
}

export async function playChart({
  chart = "free",
  country = "us",
  lang = "en",
  category,
  limit = 30,
}: {
  chart?: "free" | "paid" | "grossing";
  country?: string;
  lang?: string;
  category?: string;
  limit?: number;
}): Promise<App[]> {
  const collection =
    chart === "grossing" ? "topgrossing" : chart === "paid" ? "topselling_paid" : "topselling_free";
  const path = category
    ? `/store/apps/category/${category}/collection/${collection}`
    : `/store/apps/collection/${collection}`;
  const html = await fetchText(`${BASE}${path}?hl=${lang}&gl=${country}`);
  const packages = extractPackageNames(html, limit);

  const apps = await mapLimit(packages, 4, async (pkg) => {
    try {
      return await playAppDetail(pkg, { country, lang });
    } catch {
      return null;
    }
  });

  return apps.filter((a): a is App => Boolean(a));
}
