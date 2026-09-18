import { PageHeader } from "@/components/layout/page-header";
import { TrendTable } from "@/components/trends/trend-table";
import { WindowTabs } from "@/components/trends/window-tabs";
import { queryRising } from "@/lib/db/trends-query";
import type { RawParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

const WINDOWS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

export default async function RisingPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const raw = Array.isArray(params.window) ? params.window[0] : params.window;
  const windowDays = Number(raw) || 7;

  const rows = queryRising({ windowDays });

  return (
    <div className="pb-12">
      <PageHeader
        title="Rising"
        subtitle="Young apps already picking up momentum."
        actions={<WindowTabs options={WINDOWS} />}
      />
      <div className="px-7 pt-5">
        <TrendTable rows={rows} />
      </div>
    </div>
  );
}
