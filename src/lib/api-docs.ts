export type Endpoint = {
  method: "GET";
  path: string;
  summary: string;
  params: { name: string; description: string }[];
  example: string;
};

export const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/apps",
    summary: "Search and filter the app catalogue.",
    params: [
      { name: "q, in", description: "Search text, and which field to match (title, developer, description)." },
      { name: "store", description: "ios or android. Repeat to include both." },
      { name: "cat, xcat", description: "Categories to include or exclude. Repeatable." },
      { name: "lang", description: "Primary language code. Repeatable." },
      { name: "released", description: "Only apps released in the last N days." },
      { name: "minRevenue, minDownloads, minReviews, minRating", description: "Numeric floors." },
      { name: "priceMin, priceMax, iap", description: "Price range and in-app purchase flag." },
      { name: "signal", description: "ads, organic or onboarding — marketing signals the app has." },
      { name: "sort, dir, page, perPage", description: "Ordering and pagination." },
    ],
    example: "/api/v1/apps?store=ios&minRating=4&signal=ads&sort=downloads&perPage=20",
  },
  {
    method: "GET",
    path: "/api/v1/apps/{id}",
    summary: "One app with review history, creatives, creator videos and onboarding screens.",
    params: [{ name: "id", description: "Composite id, e.g. ios:123456789 (URL-encode the colon)." }],
    example: "/api/v1/apps/ios%3A600316760",
  },
  {
    method: "GET",
    path: "/api/v1/rankings",
    summary: "Top charts by store, chart type and country.",
    params: [
      { name: "store", description: "ios or android." },
      { name: "chart", description: "free, paid or grossing." },
      { name: "country", description: "Two-letter country code." },
      { name: "limit", description: "How many positions to return." },
    ],
    example: "/api/v1/rankings?store=ios&chart=grossing&country=us&limit=50",
  },
  {
    method: "GET",
    path: "/api/v1/reviews",
    summary: "Reviews with a rating, sentiment and topic summary for the same filter.",
    params: [
      { name: "app", description: "Restrict to one app id." },
      { name: "rating, sentiment, topic", description: "Repeatable filters." },
      { name: "window", description: "Only reviews from the last N days." },
      { name: "q, page, perPage", description: "Search text and pagination." },
    ],
    example: "/api/v1/reviews?sentiment=negative&topic=pricing&window=90",
  },
  {
    method: "GET",
    path: "/api/v1/ads",
    summary: "Advertisers grouped by app, or every creative when view=ads.",
    params: [
      { name: "view", description: "Omit for grouped by app; ads for a flat creative list." },
      { name: "cat, lang, minMrr, minDownloads, minAds, minDays", description: "Filters." },
      { name: "sort, page", description: "ads, revenue, downloads or recent." },
    ],
    example: "/api/v1/ads?view=ads&minDays=30&sort=recent",
  },
  {
    method: "GET",
    path: "/api/v1/organic",
    summary: "Creator videos mentioning apps in the catalogue.",
    params: [
      { name: "platform", description: "tiktok, instagram or youtube. Repeatable." },
      { name: "minViews, minLikes, minFollowers", description: "Numeric floors." },
      { name: "sort, page", description: "views, likes, followers or recent." },
    ],
    example: "/api/v1/organic?platform=tiktok&minViews=100000&sort=views",
  },
  {
    method: "GET",
    path: "/api/v1/flows",
    summary: "Onboarding flows and web funnels, screen by screen.",
    params: [
      { name: "kind", description: "onboarding or web-funnel." },
      { name: "screen", description: "Only flows containing this screen type. Repeatable." },
      { name: "cat, minDownloads, minMrr, sort, page", description: "Filters and ordering." },
    ],
    example: "/api/v1/flows?screen=Paywall&sort=revenue",
  },
  {
    method: "GET",
    path: "/api/v1/keywords",
    summary: "Keyword difficulty, demand proxy and the apps ranking for a term.",
    params: [
      { name: "term", description: "The keyword. Omit to get suggested terms instead." },
      { name: "limit", description: "How many suggestions to return." },
    ],
    example: "/api/v1/keywords?term=budget",
  },
  {
    method: "GET",
    path: "/api/apps/export",
    summary: "The filtered app selection as CSV. Same filters as /api/v1/apps.",
    params: [
      { name: "(any /api/v1/apps filter)", description: "Pagination is ignored: the whole selection is written, capped at 10,000 rows." },
    ],
    example: "/api/apps/export?store=ios&minReviews=1000",
  },
  {
    method: "GET",
    path: "/api/ads/export",
    summary: "Ad creatives as CSV, with the Ads Library filters applied.",
    params: [{ name: "cat, lang, minMrr, minDownloads, minAds, minDays, q", description: "Same as the Ads Library." }],
    example: "/api/ads/export?minDays=30",
  },
  {
    method: "GET",
    path: "/api/organic/export",
    summary: "Creator posts as CSV, with the Organic Content filters applied.",
    params: [{ name: "platform, cat, minViews, minLikes, minFollowers, q", description: "Same as Organic Content." }],
    example: "/api/organic/export?platform=tiktok",
  },
  {
    method: "GET",
    path: "/api/reviews/export",
    summary: "Reviews as CSV, with the Review Analytics filters applied.",
    params: [{ name: "app, rating, sentiment, topic, window, q", description: "Same as Review Analytics." }],
    example: "/api/reviews/export?sentiment=negative",
  },
];
