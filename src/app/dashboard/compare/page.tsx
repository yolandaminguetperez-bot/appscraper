import Link from "next/link";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComparePicker } from "@/components/compare/compare-picker";
import { MAX_APPS } from "@/lib/compare";
import { MultiTrendChart } from "@/components/charts/multi-trend-chart";
import { AppIcon } from "@/components/ui/app-icon";
import { getApp } from "@/lib/db/apps-repo";
import { metricsForApps } from "@/lib/db/app-query";
import { searchAppsByName } from "@/lib/db/keywords-query";
import { getAppDetail } from "@/lib/db/app-detail";
import { compactNumber, daysAgo, fileSize, money, rating } from "@/lib/format";
import type { App } from "@/lib/types";
import type { RawParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

type Row = { label: string; render: (app: App, extra: Extra) => string };
type Extra = { ads: number; organic: number; screens: number };

const ROWS: Row[] = [
  { label: "Store", render: (a) => (a.store === "ios" ? "App Store" : "Google Play") },
  { label: "Category", render: (a) => a.category ?? "—" },
  { label: "Developer", render: (a) => a.developer ?? "—" },
  { label: "Rating", render: (a) => `${rating(a.rating)} (${compactNumber(a.ratingCount)})` },
  { label: "Downloads", render: (a) => compactNumber(a.estDownloads) },
  { label: "MRR", render: (a) => money(a.estMrr) },
  { label: "Lifetime revenue", render: (a) => money(a.estRevenue) },
  { label: "Price", render: (a) => (a.price > 0 ? `$${a.price.toFixed(2)}` : "Free") },
  { label: "In-app purchases", render: (a) => (a.hasIap ? "Yes" : "No") },
  { label: "Size", render: (a) => fileSize(a.sizeBytes) },
  { label: "Released", render: (a) => daysAgo(a.releasedAt) },
  { label: "Last update", render: (a) => daysAgo(a.updatedAt) },
  { label: "Creatives running", render: (_a, extra) => String(extra.ads) },
  { label: "Creator videos", render: (_a, extra) => String(extra.organic) },
  { label: "Onboarding screens", render: (_a, extra) => String(extra.screens) },
];

export default async function ComparePage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const raw = params.app;
  const ids = (raw === undefined ? [] : Array.isArray(raw) ? raw : [raw]).slice(0, MAX_APPS);
  const term = ((Array.isArray(params.q) ? params.q[0] : params.q) ?? "").trim();

  const apps = ids.map((id) => getApp(id)).filter((app): app is App => Boolean(app));
  const extras = new Map<string, Extra>();
  for (const app of apps) {
    const detail = getAppDetail(app.id);
    extras.set(app.id, {
      ads: detail?.creatives.length ?? 0,
      organic: detail?.organic.length ?? 0,
      screens: detail?.flowScreens.length ?? 0,
    });
  }

  const trends = metricsForApps(apps.map((a) => a.id), { days: 90, column: "est_revenue" });
  const results = term ? searchAppsByName(term) : [];

  return (
    <div className="space-y-4 pb-12">
      <PageHeader
        title="Compare apps"
        subtitle={`Put up to ${MAX_APPS} apps side by side, on one scale.`}
      />

      <ComparePicker
        results={results}
        selected={apps.map((a) => ({ id: a.id, title: a.title, iconUrl: a.iconUrl }))}
      />

      {apps.length === 0 ? (
        <div className="px-7">
          <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center text-sm text-ink-muted">
            Add an app above to start the comparison.
          </div>
        </div>
      ) : (
        <>
          <div className="px-7">
            <MultiTrendChart
              title="Revenue, last 90 days"
              subtitle="Estimated daily revenue, all apps on the same scale."
              series={apps.map((app) => ({
                id: app.id,
                label: app.title,
                values: trends.get(app.id) ?? [],
              }))}
            />
          </div>

          <div className="px-7">
            <div className="scroll-thin overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">Side-by-side comparison</caption>
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="w-44 px-4 py-4 text-left text-[12px] uppercase tracking-wide text-ink-muted">
                      Metric
                    </th>
                    {apps.map((app) => (
                      <th key={app.id} scope="col" className="min-w-[180px] px-4 py-4 text-left">
                        <div className="flex items-center gap-3">
                          <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-10" />
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
                              className="block truncate font-medium hover:text-accent-ink"
                            >
                              {app.title}
                            </Link>
                            <span className="flex items-center gap-1 text-[12px] font-normal text-ink-muted">
                              <Star className="size-3 text-accent" />
                              {rating(app.rating)}
                            </span>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.label} className="border-b border-line last:border-0">
                      <th scope="row" className="px-4 py-2.5 text-left text-[12.5px] font-normal text-ink-muted">
                        {row.label}
                      </th>
                      {apps.map((app) => (
                        <td key={app.id} className="px-4 py-2.5 text-[13px] tabular-nums">
                          {row.render(app, extras.get(app.id) ?? { ads: 0, organic: 0, screens: 0 })}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
