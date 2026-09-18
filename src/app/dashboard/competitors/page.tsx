import { PageHeader } from "@/components/layout/page-header";
import { AppPicker } from "@/components/tracking/app-picker";
import { TrackedGrid } from "@/components/tracking/tracked-grid";
import { metricsForApps } from "@/lib/db/app-query";
import { searchAppsByName, trackedApps } from "@/lib/db/keywords-query";
import type { RawParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const raw = params.q;
  const term = ((Array.isArray(raw) ? raw[0] : raw) ?? "").trim();
  const results = term ? searchAppsByName(term) : [];
  const entries = trackedApps("competitor");
  const trends = metricsForApps(entries.map((entry) => entry.app.id));

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Competitor Tracking" subtitle="Watch the apps you are up against." />
      <div className="px-7">
        <AppPicker role="competitor" results={results} />
      </div>
      <div className="px-7">
        <h2 className="pb-3 text-[15px] font-semibold">Tracked competitors ({entries.length})</h2>
        <TrackedGrid
          entries={entries}
          trends={trends}
          empty={{
            title: "No competitors tracked yet",
            body: "Search an app above to keep its rating, downloads and revenue in view alongside your own.",
          }}
        />
      </div>
    </div>
  );
}
