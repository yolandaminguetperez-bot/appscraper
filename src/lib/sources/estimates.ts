/**
 * Public stores never publish download or revenue numbers, so everything here is
 * an estimate derived from signals that ARE public: rating volume, age, price and
 * whether the app sells in-app purchases. Treat the output as an order of
 * magnitude, not a fact.
 */
import type { App } from "@/lib/types";

const RATINGS_PER_DOWNLOAD = { ios: 0.012, android: 0.006 } as const;

export function estimateDownloads(app: Pick<App, "store" | "ratingCount">): number {
  const ratings = app.ratingCount ?? 0;
  if (ratings <= 0) return 0;
  return Math.round(ratings / RATINGS_PER_DOWNLOAD[app.store]);
}

/** Share of installs that ever pay, by monetization shape. */
function payerRate(app: Pick<App, "price" | "hasIap">): number {
  if (app.price > 0) return 1;
  return app.hasIap ? 0.022 : 0;
}

/** Average revenue per paying user, per month, in USD. */
function arppu(app: Pick<App, "price" | "hasIap">): number {
  if (app.price > 0) return app.price;
  return app.hasIap ? 9.5 : 0;
}

function monthsLive(releasedAt?: string | null): number {
  if (!releasedAt) return 12;
  const start = Date.parse(releasedAt);
  if (Number.isNaN(start)) return 12;
  const months = (Date.now() - start) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.max(1, Math.round(months));
}

export function estimateMonthlyRevenue(
  app: Pick<App, "store" | "ratingCount" | "price" | "hasIap" | "releasedAt">,
): number {
  const downloads = estimateDownloads(app);
  if (downloads === 0) return 0;
  const monthlyDownloads = downloads / monthsLive(app.releasedAt);

  if (app.price > 0) {
    // Paid up front: revenue tracks new downloads only, net of store commission.
    return Math.round(monthlyDownloads * app.price * 0.7);
  }
  if (!app.hasIap) return 0;

  // Subscription-ish: a slice of the install base pays each month.
  const payers = downloads * payerRate(app) * 0.35;
  return Math.round(payers * arppu(app) * 0.7);
}

export function estimateLifetimeRevenue(
  app: Pick<App, "store" | "ratingCount" | "price" | "hasIap" | "releasedAt">,
): number {
  return estimateMonthlyRevenue(app) * monthsLive(app.releasedAt);
}

export function withEstimates(app: App): App {
  return {
    ...app,
    estDownloads: estimateDownloads(app),
    estMrr: estimateMonthlyRevenue(app),
    estRevenue: estimateLifetimeRevenue(app),
  };
}
