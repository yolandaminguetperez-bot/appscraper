import { PageHeader } from "@/components/layout/page-header";
import { ActiveChips } from "@/components/filters/active-chips";
import { OrganicFilterBar } from "@/components/marketing/organic-filter-bar";
import { OrganicGrid } from "@/components/marketing/organic-grid";
import { Pagination } from "@/components/ui/pagination";
import { distinctCategories } from "@/lib/db/app-query";
import { distinctPlatforms, queryOrganic } from "@/lib/db/marketing-query";
import {
  describeOrganicFilters,
  parseOrganicFilters,
  toQueryString,
  type RawParams,
} from "@/lib/search-params";

export const dynamic = "force-dynamic";

export default async function OrganicPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const filters = parseOrganicFilters(params);
  const result = queryOrganic(filters);
  const chips = describeOrganicFilters(params);

  return (
    <div className="pb-12">
      <PageHeader title="Organic Content" subtitle="Creator videos driving installs." />
      <OrganicFilterBar platforms={distinctPlatforms()} categories={distinctCategories()} />
      <ActiveChips chips={chips} />

      <div className="px-7 pt-4">
        <OrganicGrid posts={result.posts} />
        <Pagination
          page={result.page}
          pages={result.pages}
          total={result.total}
          makeHref={(page) => `/dashboard/organic?${toQueryString(params, { page: String(page) })}`}
        />
      </div>
    </div>
  );
}
