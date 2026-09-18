import type { AppFilters, SortKey } from "@/lib/db/app-query";
import type { Store } from "@/lib/types";

export type RawParams = Record<string, string | string[] | undefined>;

function all(params: RawParams, key: string): string[] {
  const value = params[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function one(params: RawParams, key: string): string | undefined {
  return all(params, key)[0];
}

function int(params: RawParams, key: string): number | undefined {
  const raw = one(params, key);
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

const SORT_KEYS: SortKey[] = ["revenue", "downloads", "rating", "reviews", "released", "updated", "title"];

export function parseAppFilters(params: RawParams): AppFilters {
  const signals = all(params, "signal");
  const sortRaw = one(params, "sort") as SortKey | undefined;
  const iap = one(params, "iap");
  const searchIn = one(params, "in");

  return {
    q: one(params, "q"),
    searchIn: searchIn === "developer" || searchIn === "description" ? searchIn : "title",
    stores: all(params, "store").filter((s): s is Store => s === "ios" || s === "android"),
    releasedWithinDays: int(params, "released"),
    categories: all(params, "cat"),
    excludeCategories: all(params, "xcat"),
    languages: all(params, "lang"),
    priceMin: int(params, "priceMin"),
    priceMax: int(params, "priceMax"),
    hasIap: iap === undefined ? undefined : iap === "1",
    minRevenue: int(params, "minRevenue"),
    minDownloads: int(params, "minDownloads"),
    minReviews: int(params, "minReviews"),
    minRating: int(params, "minRating"),
    hasAds: signals.includes("ads") || undefined,
    hasOrganic: signals.includes("organic") || undefined,
    hasOnboarding: signals.includes("onboarding") || undefined,
    sort: sortRaw && SORT_KEYS.includes(sortRaw) ? sortRaw : "revenue",
    dir: one(params, "dir") === "asc" ? "asc" : "desc",
    page: int(params, "page") ?? 1,
    perPage: int(params, "perPage") ?? 50,
  };
}

/** An override of null removes the key, which is how a toggle link clears itself. */
export function toQueryString(
  params: RawParams,
  overrides: Record<string, string | null> = {},
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) search.append(key, v);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) search.delete(key);
    else search.set(key, value);
  }
  return search.toString();
}

const SIGNAL_LABELS: Record<string, string> = {
  ads: "Running paid ads",
  organic: "Has creator videos",
  onboarding: "Onboarding captured",
};

export function describeAppFilters(params: RawParams) {
  const chips: { key: string; value?: string; label: string }[] = [];
  const released = one(params, "released");
  if (released) chips.push({ key: "released", label: `Released: ${released}d` });

  for (const store of all(params, "store")) {
    chips.push({ key: "store", value: store, label: store === "ios" ? "App Store" : "Google Play" });
  }
  for (const cat of all(params, "cat")) chips.push({ key: "cat", value: cat, label: `Include: ${cat}` });
  for (const cat of all(params, "xcat")) chips.push({ key: "xcat", value: cat, label: `Exclude: ${cat}` });
  for (const lang of all(params, "lang")) {
    chips.push({ key: "lang", value: lang, label: `Language: ${lang.toUpperCase()}` });
  }
  for (const signal of all(params, "signal")) {
    chips.push({ key: "signal", value: signal, label: SIGNAL_LABELS[signal] ?? signal });
  }

  const numeric: [string, string][] = [
    ["priceMin", "Price ≥ $"],
    ["priceMax", "Price ≤ $"],
    ["minRevenue", "Revenue ≥ $"],
    ["minDownloads", "Downloads ≥ "],
    ["minReviews", "Reviews ≥ "],
    ["minRating", "Rating ≥ "],
  ];
  for (const [key, label] of numeric) {
    const value = one(params, key);
    if (value) chips.push({ key, label: `${label}${value}` });
  }

  const iap = one(params, "iap");
  if (iap) chips.push({ key: "iap", label: iap === "1" ? "Has IAP" : "No IAP" });

  const q = one(params, "q");
  if (q) chips.push({ key: "q", label: `“${q}”` });

  return chips;
}

function num(params: RawParams, key: string): number | undefined {
  const raw = all(params, key)[0];
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function parseAdFilters(params: RawParams) {
  const sort = one(params, "sort");
  return {
    q: one(params, "q"),
    categories: all(params, "cat"),
    languages: all(params, "lang"),
    minMrr: num(params, "minMrr"),
    minDownloads: num(params, "minDownloads"),
    minAds: num(params, "minAds"),
    minDaysRunning: num(params, "minDays"),
    country: one(params, "country"),
    sort: (sort === "revenue" || sort === "downloads" || sort === "recent" ? sort : "ads") as
      | "ads"
      | "revenue"
      | "downloads"
      | "recent",
    page: num(params, "page") ?? 1,
    perPage: num(params, "perPage"),
  };
}

export function describeAdFilters(params: RawParams) {
  const chips: { key: string; value?: string; label: string }[] = [];
  for (const cat of all(params, "cat")) chips.push({ key: "cat", value: cat, label: cat });
  for (const lang of all(params, "lang")) {
    chips.push({ key: "lang", value: lang, label: `Language: ${lang.toUpperCase()}` });
  }
  const numeric: [string, string][] = [
    ["minMrr", "MRR ≥ $"],
    ["minDownloads", "Downloads ≥ "],
    ["minAds", "Ads ≥ "],
    ["minDays", "Running ≥ "],
  ];
  for (const [key, label] of numeric) {
    const value = one(params, key);
    if (value) chips.push({ key, label: `${label}${value}${key === "minDays" ? "d" : ""}` });
  }
  const country = one(params, "country");
  if (country) chips.push({ key: "country", label: `Running in ${country.toUpperCase()}` });
  const q = one(params, "q");
  if (q) chips.push({ key: "q", label: `“${q}”` });
  return chips;
}

export function parseOrganicFilters(params: RawParams) {
  const sort = one(params, "sort");
  return {
    q: one(params, "q"),
    platforms: all(params, "platform"),
    categories: all(params, "cat"),
    minViews: num(params, "minViews"),
    minLikes: num(params, "minLikes"),
    minFollowers: num(params, "minFollowers"),
    minDownloads: num(params, "minDownloads"),
    minMrr: num(params, "minMrr"),
    sort: (sort === "likes" || sort === "recent" || sort === "followers" ? sort : "views") as
      | "views"
      | "likes"
      | "recent"
      | "followers",
    page: num(params, "page") ?? 1,
    perPage: num(params, "perPage"),
  };
}

export function describeOrganicFilters(params: RawParams) {
  const chips: { key: string; value?: string; label: string }[] = [];
  for (const p of all(params, "platform")) chips.push({ key: "platform", value: p, label: p });
  for (const cat of all(params, "cat")) chips.push({ key: "cat", value: cat, label: cat });
  const numeric: [string, string][] = [
    ["minViews", "Views ≥ "],
    ["minLikes", "Likes ≥ "],
    ["minFollowers", "Followers ≥ "],
    ["minDownloads", "App downloads ≥ "],
    ["minMrr", "App MRR ≥ $"],
  ];
  for (const [key, label] of numeric) {
    const value = one(params, key);
    if (value) chips.push({ key, label: `${label}${value}` });
  }
  const q = one(params, "q");
  if (q) chips.push({ key: "q", label: `“${q}”` });
  return chips;
}

export function parseFlowFilters(params: RawParams) {
  const sort = one(params, "sort");
  const kind = one(params, "kind");
  return {
    q: one(params, "q"),
    kinds: kind ? [kind] : [],
    screenTypes: all(params, "screen"),
    categories: all(params, "cat"),
    languages: all(params, "lang"),
    minDownloads: num(params, "minDownloads"),
    minMrr: num(params, "minMrr"),
    sort: (sort === "downloads" || sort === "screens" || sort === "recent" ? sort : "revenue") as
      | "revenue"
      | "downloads"
      | "screens"
      | "recent",
    page: num(params, "page") ?? 1,
    perPage: num(params, "perPage"),
  };
}

export function describeFlowFilters(params: RawParams) {
  const chips: { key: string; value?: string; label: string }[] = [];
  const kind = one(params, "kind");
  if (kind) chips.push({ key: "kind", label: kind === "web-funnel" ? "Web funnels" : "Onboardings" });
  for (const screen of all(params, "screen")) {
    chips.push({ key: "screen", value: screen, label: `Screen: ${screen}` });
  }
  for (const cat of all(params, "cat")) chips.push({ key: "cat", value: cat, label: cat });
  for (const lang of all(params, "lang")) {
    chips.push({ key: "lang", value: lang, label: `Language: ${lang.toUpperCase()}` });
  }
  const numeric: [string, string][] = [
    ["minDownloads", "Downloads ≥ "],
    ["minMrr", "MRR ≥ $"],
  ];
  for (const [key, label] of numeric) {
    const value = one(params, key);
    if (value) chips.push({ key, label: `${label}${value}` });
  }
  const q = one(params, "q");
  if (q) chips.push({ key: "q", label: `“${q}”` });
  return chips;
}

export function parseReviewFilters(params: RawParams) {
  return {
    appId: one(params, "app"),
    q: one(params, "q"),
    ratings: all(params, "rating").map(Number).filter(Number.isFinite),
    sentiments: all(params, "sentiment"),
    topics: all(params, "topic"),
    windowDays: num(params, "window"),
    page: num(params, "page") ?? 1,
    perPage: num(params, "perPage"),
  };
}

export function describeReviewFilters(params: RawParams) {
  const chips: { key: string; value?: string; label: string }[] = [];
  for (const r of all(params, "rating")) chips.push({ key: "rating", value: r, label: `${r} stars` });
  for (const s of all(params, "sentiment")) chips.push({ key: "sentiment", value: s, label: s });
  for (const t of all(params, "topic")) chips.push({ key: "topic", value: t, label: `Topic: ${t}` });
  const w = one(params, "window");
  if (w) chips.push({ key: "window", label: `Last ${w}d` });
  const q = one(params, "q");
  if (q) chips.push({ key: "q", label: `“${q}”` });
  return chips;
}
