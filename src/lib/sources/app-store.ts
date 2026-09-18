import { fetchJson, mapLimit } from "@/lib/sources/http";
import { withEstimates } from "@/lib/sources/estimates";
import type { App, Review } from "@/lib/types";

type ItunesApp = {
  trackId: number;
  bundleId?: string;
  trackName: string;
  description?: string;
  artistName?: string;
  artistId?: number;
  artistViewUrl?: string;
  artworkUrl512?: string;
  artworkUrl100?: string;
  trackViewUrl?: string;
  primaryGenreName?: string;
  genres?: string[];
  price?: number;
  currency?: string;
  contentAdvisoryRating?: string;
  languageCodesISO2A?: string[];
  averageUserRating?: number;
  userRatingCount?: number;
  version?: string;
  fileSizeBytes?: string;
  releaseDate?: string;
  currentVersionReleaseDate?: string;
  screenshotUrls?: string[];
};

type ItunesResponse = { resultCount: number; results: ItunesApp[] };

const API = "https://itunes.apple.com";

function toApp(raw: ItunesApp): App {
  const genres = raw.genres ?? (raw.primaryGenreName ? [raw.primaryGenreName] : []);
  const price = raw.price ?? 0;

  const app: App = {
    id: `ios:${raw.trackId}`,
    store: "ios",
    storeId: String(raw.trackId),
    bundleId: raw.bundleId ?? null,
    title: raw.trackName,
    subtitle: null,
    description: raw.description ?? null,
    developer: raw.artistName ?? null,
    developerId: raw.artistId ? String(raw.artistId) : null,
    developerUrl: raw.artistViewUrl ?? null,
    iconUrl: raw.artworkUrl512 ?? raw.artworkUrl100 ?? null,
    storeUrl: raw.trackViewUrl ?? null,
    category: raw.primaryGenreName ?? null,
    categories: genres,
    price,
    currency: raw.currency ?? null,
    // The lookup API does not expose IAP directly; free apps in these genres
    // almost always monetize with them, and paid apps often do too.
    hasIap: price === 0,
    contentRating: raw.contentAdvisoryRating ?? null,
    primaryLanguage: raw.languageCodesISO2A?.[0]?.toLowerCase() ?? null,
    languages: (raw.languageCodesISO2A ?? []).map((l) => l.toLowerCase()),
    rating: raw.averageUserRating ?? null,
    ratingCount: raw.userRatingCount ?? null,
    version: raw.version ?? null,
    sizeBytes: raw.fileSizeBytes ? Number(raw.fileSizeBytes) : null,
    releasedAt: raw.releaseDate ?? null,
    updatedAt: raw.currentVersionReleaseDate ?? null,
    screenshots: raw.screenshotUrls ?? [],
    estDownloads: null,
    estRevenue: null,
    estMrr: null,
    isGame: genres.some((g) => g.toLowerCase() === "games"),
    fetchedAt: new Date().toISOString(),
  };

  return withEstimates(app);
}

export async function searchAppStore(
  term: string,
  { country = "us", limit = 50 }: { country?: string; limit?: number } = {},
): Promise<App[]> {
  const url = `${API}/search?term=${encodeURIComponent(term)}&country=${country}&entity=software&limit=${Math.min(limit, 200)}`;
  const data = await fetchJson<ItunesResponse>(url);
  return data.results.map(toApp);
}

export async function lookupAppStore(
  ids: string[],
  { country = "us" }: { country?: string } = {},
): Promise<App[]> {
  if (ids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));

  const pages = await mapLimit(chunks, 3, async (chunk) => {
    const url = `${API}/lookup?id=${chunk.join(",")}&country=${country}&entity=software`;
    const data = await fetchJson<ItunesResponse>(url);
    return data.results.filter((r) => Boolean(r.trackId)).map(toApp);
  });

  return pages.flat();
}

type RssFeed = { feed?: { results?: Array<{ id: string }> } };

/** `chart` maps to Apple's public marketing feeds. */
export async function appStoreChart({
  chart = "free",
  country = "us",
  genre,
  limit = 50,
}: {
  chart?: "free" | "paid" | "grossing";
  country?: string;
  genre?: string;
  limit?: number;
}): Promise<App[]> {
  const kind = chart === "grossing" ? "top-grossing-applications" : `top-${chart}-applications`;
  const path = genre ? `${kind}/${genre}` : kind;
  const url = `https://rss.applemarketingtools.com/api/v2/${country}/apps/${path}/${Math.min(limit, 200)}/apps.json`;
  const feed = await fetchJson<RssFeed>(url);
  const ids = (feed.feed?.results ?? []).map((r) => r.id);
  const apps = await lookupAppStore(ids, { country });

  // Preserve chart order, which the lookup endpoint does not keep.
  const byId = new Map(apps.map((a) => [a.storeId, a]));
  return ids.map((id) => byId.get(id)).filter((a): a is App => Boolean(a));
}

type RssReviewFeed = {
  feed?: {
    entry?: Array<{
      id?: { label?: string };
      author?: { name?: { label?: string } };
      "im:rating"?: { label?: string };
      "im:version"?: { label?: string };
      title?: { label?: string };
      content?: { label?: string };
      updated?: { label?: string };
    }>;
  };
};

export async function appStoreReviews(
  storeId: string,
  { country = "us", pages = 2 }: { country?: string; pages?: number } = {},
): Promise<Review[]> {
  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1);

  const batches = await mapLimit(pageNumbers, 2, async (page) => {
    const url = `${API}/${country}/rss/customerreviews/page=${page}/id=${storeId}/sortby=mostrecent/json`;
    const feed = await fetchJson<RssReviewFeed>(url);
    const entries = feed.feed?.entry ?? [];
    // The first entry of page 1 is the app itself, not a review.
    const reviews = entries.filter((e) => e["im:rating"]?.label);

    return reviews.map<Review>((e) => ({
      id: `ios:${storeId}:${e.id?.label ?? crypto.randomUUID()}`,
      appId: `ios:${storeId}`,
      author: e.author?.name?.label ?? null,
      rating: e["im:rating"]?.label ? Number(e["im:rating"].label) : null,
      title: e.title?.label ?? null,
      body: e.content?.label ?? null,
      version: e["im:version"]?.label ?? null,
      country,
      postedAt: e.updated?.label ?? null,
    }));
  });

  return batches.flat();
}
