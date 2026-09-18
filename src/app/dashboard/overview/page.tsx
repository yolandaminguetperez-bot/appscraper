import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatTile } from "@/components/charts/stat-tile";
import { BarChart } from "@/components/charts/bar-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { MiniChart } from "@/components/charts/mini-chart";
import { AppIcon } from "@/components/ui/app-icon";
import { metricsForApps } from "@/lib/db/app-query";
import {
  creativesByFormat,
  organicByPlatform,
  overviewTotals,
  releasesByMonth,
  revenueByCategory,
  screenTypeMix,
  topMovers,
} from "@/lib/db/overview-query";
import { compactNumber, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const totals = overviewTotals();
  const categories = revenueByCategory();
  const releases = releasesByMonth();
  const movers = topMovers();
  const trends = metricsForApps(movers.map((m) => m.app.id), { days: 30, column: "est_downloads" });
  const platforms = organicByPlatform();
  const formats = creativesByFormat();
  const screens = screenTypeMix();

  return (
    <div className="space-y-4 pb-12">
      <PageHeader title="Overview" subtitle="The whole catalogue at a glance." />

      <div className="grid gap-4 px-7 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Apps tracked"
          value={totals.apps.toLocaleString()}
          icon="apps"
          note={`${totals.ios.toLocaleString()} App Store · ${totals.android.toLocaleString()} Google Play`}
        />
        <StatTile
          label="Combined MRR"
          value={money(totals.mrr)}
          icon="trending"
          note="Estimated across every app on file"
        />
        <StatTile
          label="Running ads"
          value={totals.advertisers.toLocaleString()}
          icon="ads"
          note={`${totals.creatives.toLocaleString()} creatives on file`}
        />
        <StatTile
          label="Creator videos"
          value={totals.organicPosts.toLocaleString()}
          icon="organic"
          note={`${totals.flows.toLocaleString()} onboarding flows captured`}
        />
      </div>

      <div className="grid gap-4 px-7 lg:grid-cols-2">
        <BarChart
          title="Revenue by category"
          subtitle="Combined monthly estimate, top categories."
          bars={categories.map((c) => ({ label: c.label, value: c.value, note: `${c.apps} apps` }))}
          format="money"
        />

        <TrendChart
          title="Releases per month"
          subtitle="Apps in the catalogue by release month."
          points={releases}
        />
      </div>

      <div className="grid gap-4 px-7 lg:grid-cols-3">
        <section className="surface-card p-5 lg:col-span-2">
          <h3 className="text-[15px] font-semibold">Biggest movers</h3>
          <p className="pt-0.5 text-[12.5px] text-ink-muted">Most reviews gained in the last 30 days.</p>
          <ul className="pt-3">
            {movers.map(({ app, gained }) => (
              <li
                key={app.id}
                className="flex items-center gap-3 border-b border-line py-2.5 last:border-0"
              >
                <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-9" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
                    className="block truncate text-[13.5px] font-medium hover:text-accent-ink"
                  >
                    {app.title}
                  </Link>
                  <span className="block truncate text-[12px] text-ink-muted">{app.category}</span>
                </div>
                <MiniChart
                  values={trends.get(app.id) ?? []}
                  label={`Downloads trend for ${app.title}`}
                  className="h-8 w-24 shrink-0"
                />
                <span className="w-20 shrink-0 text-right text-[12.5px] tabular-nums text-accent-ink">
                  +{compactNumber(gained)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <BarChart
            title="Creator videos by platform"
            bars={platforms.map((p) => ({ label: p.label, value: p.value }))}
          />
          <BarChart
            title="Creatives by format"
            bars={formats.map((f) => ({ label: f.label, value: f.value }))}
          />
        </div>
      </div>

      <div className="px-7">
        <BarChart
          title="Most common onboarding screens"
          subtitle="Across every flow captured."
          bars={screens.map((s) => ({ label: s.label, value: s.value }))}
        />
      </div>
    </div>
  );
}
