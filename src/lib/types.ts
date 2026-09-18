export type Store = "ios" | "android";

export type App = {
  id: string;
  store: Store;
  storeId: string;
  bundleId?: string | null;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  developer?: string | null;
  developerId?: string | null;
  developerUrl?: string | null;
  iconUrl?: string | null;
  storeUrl?: string | null;
  category?: string | null;
  categories: string[];
  price: number;
  currency?: string | null;
  hasIap: boolean;
  contentRating?: string | null;
  primaryLanguage?: string | null;
  languages: string[];
  rating?: number | null;
  ratingCount?: number | null;
  version?: string | null;
  sizeBytes?: number | null;
  releasedAt?: string | null;
  updatedAt?: string | null;
  screenshots: string[];
  estDownloads?: number | null;
  estRevenue?: number | null;
  estMrr?: number | null;
  isGame: boolean;
  fetchedAt: string;
};

export type Review = {
  id: string;
  appId: string;
  author?: string | null;
  rating?: number | null;
  title?: string | null;
  body?: string | null;
  version?: string | null;
  country?: string | null;
  postedAt?: string | null;
};

export type RankingEntry = {
  position: number;
  app: App;
};
