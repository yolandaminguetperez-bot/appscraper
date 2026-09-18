import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AppsTable } from "@/components/apps/apps-table";
import { BarChart } from "@/components/charts/bar-chart";
import { StatTile } from "@/components/charts/stat-tile";
import { developerApps, developerSummary } from "@/lib/db/developer-query";
import { metricsForApps } from "@/lib/db/app-query";
import { favoriteIds } from "@/lib/db/favorites";
import { compactNumber, money, rating } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DeveloperPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const developer = decodeURIComponent(name);
  const summary = developerSummary(developer);
  if (!summary) notFound();

  const apps = developerApps(developer);
  const trends = metricsForApps(apps.map((app) => app.id));

  return (
    <div className="pb-12">
      <div className="px-7 pt-6">
        <Link
          href="/dashboard/apps"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Back to apps
        </Link>
      </div>

      <PageHeader
        title={developer}
        subtitle={`${summary.apps} ${summary.apps === 1 ? "app" : "apps"} · ${summary.stores.ios} on the App Store · ${summary.stores.android} on Google Play`}
      />

      <div className="grid gap-4 px-7 pt-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Combined downloads" value={compactNumber(summary.downloads)} icon="trending" />
        <StatTile label="Combined MRR" value={money(summary.mrr)} icon="trending" />
        <StatTile label="Lifetime revenue" value={money(summary.revenue)} icon="trending" />
        <StatTile
          label="Average rating"
          value={rating(summary.avgRating)}
          icon="reviews"
          note={`${summary.advertising} of ${summary.apps} running ads`}
        />
      </div>

      {summary.categories.length > 1 && (
        <div className="px-7 pt-4">
          <BarChart
            title="Where this portfolio sits"
            subtitle="Apps per category."
            bars={summary.categories.map((c) => ({ label: c.label, value: c.count }))}
          />
        </div>
      )}

      <div className="px-7 pt-4">
        <AppsTable apps={apps} favorites={favoriteIds("app")} trends={trends} />
      </div>
    </div>
  );
}
