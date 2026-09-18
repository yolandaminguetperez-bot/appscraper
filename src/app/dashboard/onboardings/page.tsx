import { PageHeader } from "@/components/layout/page-header";
import { ActiveChips } from "@/components/filters/active-chips";
import { FlowsFilterBar } from "@/components/flows/flows-filter-bar";
import { FlowCard } from "@/components/flows/flow-card";
import { Pagination } from "@/components/ui/pagination";
import { distinctCategories, distinctLanguages } from "@/lib/db/app-query";
import { distinctScreenTypes, queryFlows } from "@/lib/db/flows-query";
import { describeFlowFilters, parseFlowFilters, toQueryString, type RawParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export default async function OnboardingsPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const filters = parseFlowFilters(params);
  const result = queryFlows(filters);
  const chips = describeFlowFilters(params);

  return (
    <div className="pb-12">
      <PageHeader title="Onboarding Flows" subtitle="Screen-by-screen flows from shipping apps." />
      <FlowsFilterBar
        screenTypes={distinctScreenTypes()}
        categories={distinctCategories()}
        languages={distinctLanguages()}
      />
      <ActiveChips chips={chips} />

      <div className="space-y-4 px-7 pt-4">
        {result.flows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center text-sm text-ink-muted">
            No flows match these filters.
          </div>
        )}
        {result.flows.map((flow) => (
          <FlowCard key={flow.id} flow={flow} />
        ))}
        <Pagination
          page={result.page}
          pages={result.pages}
          total={result.total}
          makeHref={(page) => `/dashboard/onboardings?${toQueryString(params, { page: String(page) })}`}
        />
      </div>
    </div>
  );
}
