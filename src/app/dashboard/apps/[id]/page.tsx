import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { getAppDetail } from "@/lib/db/app-detail";
import { TrendChart } from "@/components/charts/trend-chart";
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
    <section className="rounded-2xl border border-line bg-surface p-5">
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
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">{app.title}</h1>
          <p className="pt-1 text-sm text-ink-muted">
            {app.developer} · {app.category} · {app.store === "ios" ? "App Store" : "Google Play"}
          </p>
        </div>
        <div className="flex items-center gap-2">
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

          <Section title="Description">
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink-muted">
              {app.description ?? "No description on file."}
            </p>
          </Section>

          {flowScreens.length > 0 && (
            <Section title="Onboarding flow">
              <ol className="scroll-thin flex gap-2.5 overflow-x-auto pb-2">
                {flowScreens.map((screen) => (
                  <li key={screen.id} className="w-[104px] shrink-0">
                    <div className="flex aspect-[9/16] flex-col justify-between rounded-xl border border-panel-line bg-panel p-2 text-panel-ink">
                      <span className="text-[10px] text-panel-ink-muted">
                        {String(screen.position + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[11px] leading-tight">{screen.screenType}</span>
                    </div>
                  </li>
                ))}
              </ol>
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

          <Section title={`Ads (${creatives.length})`}>
            {creatives.length === 0 ? (
              <p className="text-[13px] text-ink-muted">Not running paid creatives.</p>
            ) : (
              <ul className="space-y-2">
                {creatives.map((creative) => (
                  <li key={creative.id} className="rounded-xl bg-surface-muted px-3 py-2">
                    <p className="line-clamp-2 text-[12.5px]">{creative.headline}</p>
                    <p className="pt-0.5 text-[11.5px] text-ink-faint">
                      {creative.kind} · {creative.daysRunning}d running
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={`Creator videos (${organic.length})`}>
            {organic.length === 0 ? (
              <p className="text-[13px] text-ink-muted">No creator videos on file.</p>
            ) : (
              <ul className="space-y-2">
                {organic.map((post) => (
                  <li
                    key={post.id}
                    className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2 text-[12.5px]"
                  >
                    <span className="truncate">{post.author}</span>
                    <span className="shrink-0 text-ink-muted">{compactNumber(post.views)} views</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
