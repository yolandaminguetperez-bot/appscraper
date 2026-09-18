import { PageHeader } from "@/components/layout/page-header";
import { ActiveChips } from "@/components/filters/active-chips";
import { AdsFilterBar } from "@/components/marketing/ads-filter-bar";
import { AdGroupCard, CreativeCards } from "@/components/marketing/ad-cards";
import { Pagination } from "@/components/ui/pagination";
import { SaveView } from "@/components/views/save-view";
import { ExportButton } from "@/components/ui/export-button";
import { findSavedView, listSavedViews } from "@/lib/db/saved-views";
import { distinctCategories, distinctLanguages } from "@/lib/db/app-query";
import { adCountryReach, queryAdGroups, queryCreatives } from "@/lib/db/marketing-query";
import { WorldMap } from "@/components/trends/world-map";
import { favoriteIds } from "@/lib/db/favorites";
import { describeAdFilters, parseAdFilters, toQueryString, type RawParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export default async function AdsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const filters = parseAdFilters(params);
  const view = params.view === "ads" ? "ads" : "grouped";
  const chips = describeAdFilters(params);
  const savedViews = listSavedViews("/dashboard/ads");
  const savedId = findSavedView("/dashboard/ads", toQueryString(params))?.id ?? null;

  const savedApps = favoriteIds("app");
  const savedAds = favoriteIds("ad");

  const grouped = view === "grouped" ? queryAdGroups(filters) : null;
  const flat = view === "ads" ? queryCreatives(filters) : null;
  const reach = adCountryReach(filters);
  const total = grouped?.total ?? flat?.total ?? 0;
  const pages = grouped?.pages ?? flat?.pages ?? 1;

  return (
    <div className="pb-12">
      <PageHeader
        title="Ads Library"
        subtitle={view === "grouped" ? "Apps running paid creatives." : "Every creative we have on file."}
        actions={
          <>
            <SaveView views={savedViews} savedId={savedId} />
            <ExportButton href={`/api/ads/export?${toQueryString(params)}`} />
          </>
        }
      />

      <AdsFilterBar
        categories={distinctCategories()}
        languages={distinctLanguages()}
        view={view}
      />
      <ActiveChips chips={chips} />

      {/* Capped: at full width the map pushed the creatives themselves below
          the fold, and the creatives are why the page exists. */}
      {reach.length > 0 && (
        <div className="max-w-4xl px-7 pt-4">
          <WorldMap
            title="Where these ads run"
            description="Creatives in the current selection, counted by the countries they are served in."
            valueHeading="Creatives"
            values={reach.map((row) => ({
              code: row.code,
              value: row.creatives,
              label: `${row.code.toUpperCase()} — ${row.creatives.toLocaleString()} creatives running here`,
            }))}
          />
        </div>
      )}

      <div className="px-7 pt-4">
        {grouped && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {grouped.groups.map((group) => (
              <AdGroupCard key={group.app.id} group={group} favorites={savedApps} />
            ))}
          </div>
        )}

        {flat && (
          <CreativeCards creatives={flat.creatives} savedIds={savedAds} />
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
          perPage={grouped?.perPage ?? flat?.perPage ?? 24}
          perPageOptions={view === "ads" ? [24, 48, 96, 192] : [12, 24, 48, 96]}
        />
      </div>
    </div>
  );
}
