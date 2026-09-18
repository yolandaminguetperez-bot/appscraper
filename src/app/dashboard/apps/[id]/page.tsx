import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { getAppDetail } from "@/lib/db/app-detail";
import { TrendChart } from "@/components/charts/trend-chart";
import { ScreenStrip } from "@/components/flows/screen-strip";
import { AppIcon } from "@/components/ui/app-icon";
import { CreativeGrid } from "@/components/marketing/creative-grid";
import { OrganicGrid } from "@/components/marketing/organic-grid";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { favoriteIds } from "@/lib/db/favorites";
import { similarApps } from "@/lib/db/developer-query";
import { difficultyBand, titleKeywords } from "@/lib/db/keywords-query";
import { WorldMap } from "@/components/trends/world-map";
import { AlertButton } from "@/components/alerts/alert-button";
import { KeywordRanks } from "@/components/aso/keyword-ranks";
import { MarketSplit } from "@/components/aso/market-split";
import { countriesForApp, keywordRanksForApp } from "@/lib/db/aso-query";
import { compactNumber, daysAgo, fileSize, money, rating } from "@/lib/format";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-[11.5px] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="pt-0.5 text-[17px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5">
      <h2 className="pb-3 text-[15px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getAppDetail(decodeURIComponent(id));
  if (!detail) notFound();

  const { app, history, reviews, creatives, organic, flowScreens, ratingBreakdown } = detail;
  const saved = favoriteIds("app");
  const similar = similarApps(app);
  const keywords = titleKeywords(app.title);
  const ranks = keywordRanksForApp(app.id);
  const markets = countriesForApp(app.id);

  // Counted from the creatives already loaded for this page rather than with a
  // second query: they are the same rows the ads section below renders.
  const adReach = new Map<string, number>();
  for (const creative of creatives) {
    for (const code of creative.countries) {
      adReach.set(code.toLowerCase(), (adReach.get(code.toLowerCase()) ?? 0) + 1);
    }
  }

  const badges = [
    app.category,
    app.store === "ios" ? "App Store" : "Google Play",
    app.price > 0 ? `$${app.price.toFixed(2)}` : "Free",
    app.hasIap ? "In-app purchases" : null,
    app.contentRating,
  ].filter((value): value is string => Boolean(value));
  const totalReviews = ratingBreakdown.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-5 px-7 pb-12 pt-6">
      <Link
        href="/dashboard/apps"
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Back to apps
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-16" />
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight">{app.title}</h1>
            {app.developer ? (
              <Link
                href={`/dashboard/developers/${encodeURIComponent(app.developer)}`}
                className="pt-0.5 text-sm text-ink-muted hover:text-accent-ink"
              >
                {app.developer}
              </Link>
            ) : null}
            <ul className="flex flex-wrap gap-1.5 pt-2.5">
              {badges.map((badge) => (
                <li
                  key={badge}
                  className="rounded-full bg-surface-muted px-2.5 py-1 text-[11.5px] text-ink-muted"
                >
                  {badge}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertButton appId={app.id} title={app.title} />
          <FavoriteButton kind="app" refId={app.id} initial={saved.has(app.id)} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-[13px]">
            <Star className="size-3.5 text-accent" />
            {rating(app.rating)} · {compactNumber(app.ratingCount)} reviews
          </span>
          {app.storeUrl && (
            <a
              href={app.storeUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-panel hover:bg-accent-ink hover:text-white"
            >
              Open in store
            </a>
          )}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Downloads" value={compactNumber(app.estDownloads)} />
        <Stat label="MRR" value={money(app.estMrr)} />
        <Stat label="Lifetime revenue" value={money(app.estRevenue)} />
        <Stat label="Price" value={app.price > 0 ? `$${app.price.toFixed(2)}` : "Free"} />
        <Stat label="Size" value={fileSize(app.sizeBytes)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <TrendChart
            title={`Revenue, last ${history.length} days`}
            subtitle="Estimated, from review volume, price and monetization shape."
            format="money"
            points={history.map((point) => ({ day: point.day, value: point.revenue ?? 0 }))}
          />

          <TrendChart
            title={`Downloads, last ${history.length} days`}
            subtitle={`Released ${daysAgo(app.releasedAt)} · updated ${daysAgo(app.updatedAt)}`}
            points={history.map((point) => ({ day: point.day, value: point.downloads ?? 0 }))}
          />

          {app.screenshots.length > 0 && (
            <Section title="Screenshots">
              <ul className="scroll-thin flex gap-3 overflow-x-auto pb-2">
                {app.screenshots.map((url, index) => (
                  <li key={url + index} className="w-[132px] shrink-0">
                    {/* Store screenshots come from arbitrary CDNs; these render small
                        and next/image would need every host allow-listed. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${app.title} screenshot ${index + 1}`}
                      loading="lazy"
                      className="block aspect-[15/32] w-full rounded-xl border border-panel-line object-cover"
                    />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Description">
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink-muted">
              {app.description ?? "No description on file."}
            </p>
          </Section>

          {flowScreens.length > 0 && (
            <Section title="Onboarding flow">
              <ScreenStrip screens={flowScreens} title={app.title} />
            </Section>
          )}

          {ranks.length > 0 && (
            <Section title="Search rankings">
              <p className="-mt-2 pb-3 text-[12px] text-ink-muted">
                Position for the terms this app is tracked on, and how it moved in 30 days.
              </p>
              <KeywordRanks ranks={ranks} />
            </Section>
          )}

          {markets.length > 0 && (
            <Section title="Where the money comes from">
              <p className="-mt-2 pb-3 text-[12px] text-ink-muted">
                Share of this app&apos;s installs and revenue by country.
              </p>
              <MarketSplit markets={markets} />
            </Section>
          )}

          {keywords.length > 0 && (
            <Section title="Keywords in this title">
              <p className="-mt-2 pb-3 text-[12px] text-ink-muted">
                What this app is already competing on, hardest first.
              </p>
              <ul className="divide-y divide-line">
                {keywords.map((keyword) => (
                  <li key={keyword.term} className="flex items-center gap-3 py-2">
                    <Link
                      href={`/dashboard/keywords?term=${encodeURIComponent(keyword.term)}`}
                      className="min-w-0 flex-1 truncate text-[13.5px] font-medium hover:text-accent-ink"
                    >
                      {keyword.term}
                    </Link>
                    <span className="text-[12.5px] tabular-nums text-ink-muted">
                      {keyword.apps.toLocaleString()} apps
                    </span>
                    <span className="w-24 text-right text-[12.5px] tabular-nums">
                      {keyword.difficulty}
                      <span className="pl-1.5 text-[11px] text-ink-faint">
                        {difficultyBand(keyword.difficulty)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {similar.length > 0 && (
            <Section title="Apps of a similar size in this category">
              <ul className="grid gap-2 sm:grid-cols-2">
                {similar.map((other) => (
                  <li key={other.id}>
                    <Link
                      href={`/dashboard/apps/${encodeURIComponent(other.id)}`}
                      className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition-colors hover:border-accent/40"
                    >
                      <AppIcon
                        id={other.id}
                        title={other.title}
                        iconUrl={other.iconUrl}
                        className="size-9"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium">{other.title}</span>
                        <span className="block truncate text-[12px] text-ink-muted">
                          {compactNumber(other.estDownloads)} downloads · {money(other.estMrr)} MRR
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Recent reviews">
            {reviews.length === 0 ? (
              <p className="text-[13px] text-ink-muted">No reviews on file.</p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((review) => (
                  <li key={review.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 text-[12.5px] text-ink-muted">
                      <span className="inline-flex items-center gap-1 text-ink">
                        <Star className="size-3 text-accent" />
                        {review.rating}
                      </span>
                      <span>{review.author}</span>
                      <span>· {daysAgo(review.postedAt)}</span>
                    </div>
                    <p className="pt-1 text-[13.5px] font-medium">{review.title}</p>
                    <p className="text-[13px] text-ink-muted">{review.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-5">
          <Section title={`Rating breakdown (${totalReviews} sampled)`}>
            <ul className="space-y-1.5">
              {ratingBreakdown.map((row) => {
                const share = totalReviews ? (row.count / totalReviews) * 100 : 0;
                return (
                  <li key={row.stars} className="flex items-center gap-2 text-[12.5px]">
                    <span className="w-3 text-ink-muted">{row.stars}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${share}%` }}
                      />
                    </span>
                    <span className="w-8 text-right tabular-nums text-ink-muted">{row.count}</span>
                  </li>
                );
              })}
            </ul>
            <p className="pt-2 text-[11.5px] text-ink-faint">
              Based on the reviews we hold, not the store&apos;s full count.
            </p>
          </Section>

          {adReach.size > 0 && (
            <WorldMap
              title="Where this app advertises"
              description={`Countries the ${creatives.length} creatives below are served in.`}
              valueHeading="Creatives"
              values={[...adReach.entries()].map(([code, count]) => ({
                code,
                value: count,
                href: `/dashboard/ads?q=${encodeURIComponent(app.title)}&country=${code}`,
                label: `${code.toUpperCase()} — ${count} of this app's creatives run here`,
              }))}
            />
          )}

          <Section title={`Ads (${creatives.length})`}>
            {creatives.length === 0 ? (
              <p className="text-[13px] text-ink-muted">Not running paid creatives.</p>
            ) : (
              <CreativeGrid
                creatives={creatives.map((creative) => ({ ...creative, appTitle: app.title }))}
                columns="grid grid-cols-2 gap-2.5"
              />
            )}
          </Section>

          <Section title={`Creator videos (${organic.length})`}>
            {organic.length === 0 ? (
              <p className="text-[13px] text-ink-muted">No creator videos on file.</p>
            ) : (
              <OrganicGrid
                posts={organic.map((post) => ({
                  ...post,
                  appId: app.id,
                  appTitle: app.title,
                  appCategory: app.category ?? null,
                  appIconUrl: app.iconUrl ?? null,
                  comments: null,
                  authorFollowers: null,
                  postUrl: null,
                  postedAt: null,
                }))}
                favorites={new Set<string>()}
                columns="grid grid-cols-2 gap-2.5"
              />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
