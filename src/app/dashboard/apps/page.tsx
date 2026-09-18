import { Download } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { AppsFilterBar } from "@/components/apps/apps-filter-bar";
import { AppsTable } from "@/components/apps/apps-table";
import { AppsGrid } from "@/components/apps/apps-grid";
import { ViewToggle } from "@/components/apps/view-toggle";
import { ActiveChips } from "@/components/filters/active-chips";
import { Pagination } from "@/components/ui/pagination";
import { distinctCategories, distinctLanguages, metricsForApps, queryApps } from "@/lib/db/app-query";
import { favoriteIds } from "@/lib/db/favorites";
import { describeAppFilters, parseAppFilters, toQueryString, type RawParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const filters = parseAppFilters(params);
  const result = queryApps(filters);
  const chips = describeAppFilters(params);
  const trends = metricsForApps(result.apps.map((app) => app.id));
  const view = (Array.isArray(params.view) ? params.view[0] : params.view) === "grid" ? "grid" : "table";
  const favorites = favoriteIds("app");

  return (
    <div className="pb-12">
      <PageHeader
        title="Explore Apps"
        subtitle={
          chips.length
            ? `${chips.length} ${chips.length === 1 ? "filter" : "filters"} active`
            : "Search every app on the App Store and Google Play."
        }
        actions={
          <>
          <ViewToggle />
          <Link
            href={`/api/apps/export?${toQueryString(params)}`}
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-panel transition-colors hover:bg-accent-ink hover:text-white"
          >
            <Download className="size-4" />
            Export CSV
          </Link>
          </>
        }
      />

      <AppsFilterBar categories={distinctCategories()} languages={distinctLanguages()} />
      <ActiveChips chips={chips} />

      <div className="px-7 pt-4">
        {view === "grid" ? (
          <AppsGrid apps={result.apps} favorites={favorites} trends={trends} />
        ) : (
          <AppsTable apps={result.apps} favorites={favorites} trends={trends} />
        )}
        <Pagination
          page={result.page}
          pages={result.pages}
          total={result.total}
          makeHref={(page) => `/dashboard/apps?${toQueryString(params, { page: String(page) })}`}
        />
      </div>
    </div>
  );
}
