import { PageHeader } from "@/components/layout/page-header";
import { ActiveChips } from "@/components/filters/active-chips";
import { AdsFilterBar } from "@/components/marketing/ads-filter-bar";
import { AdGroupCard, CreativeCard } from "@/components/marketing/ad-cards";
import { Pagination } from "@/components/ui/pagination";
import { distinctCategories, distinctLanguages } from "@/lib/db/app-query";
import { queryAdGroups, queryCreatives } from "@/lib/db/marketing-query";
import { favoriteIds } from "@/lib/db/favorites";
import { describeAdFilters, parseAdFilters, toQueryString, type RawParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export default async function AdsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const filters = parseAdFilters(params);
  const view = params.view === "ads" ? "ads" : "grouped";
  const chips = describeAdFilters(params);

  const savedApps = favoriteIds("app");
  const savedAds = favoriteIds("ad");

  const grouped = view === "grouped" ? queryAdGroups(filters) : null;
  const flat = view === "ads" ? queryCreatives(filters) : null;
  const total = grouped?.total ?? flat?.total ?? 0;
  const pages = grouped?.pages ?? flat?.pages ?? 1;

  return (
    <div className="pb-12">
      <PageHeader
        title="Ads Library"
        subtitle={view === "grouped" ? "Apps running paid creatives." : "Every creative we have on file."}
      />

      <AdsFilterBar
        categories={distinctCategories()}
        languages={distinctLanguages()}
        view={view}
      />
      <ActiveChips chips={chips} />

      <div className="px-7 pt-4">
        {grouped && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {grouped.groups.map((group) => (
              <AdGroupCard key={group.app.id} group={group} favorites={savedApps} />
            ))}
          </div>
        )}

        {flat && (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {flat.creatives.map((creative) => (
              <CreativeCard key={creative.id} creative={creative} saved={savedAds.has(creative.id)} />
            ))}
          </div>
        )}

        {total === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center text-sm text-ink-muted">
            No advertisers match these filters.
          </div>
        )}

        <Pagination
          page={filters.page}
          pages={pages}
          total={total}
          makeHref={(page) => `/dashboard/ads?${toQueryString(params, { page: String(page) })}`}
        />
      </div>
    </div>
  );
}
