import Link from "next/link";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AppIcon } from "@/components/ui/app-icon";
import { RankingsControls } from "@/components/trends/rankings-controls";
import { queryRankings, rankHistory, rankingCountries } from "@/lib/db/trends-query";
import { MiniChart } from "@/components/charts/mini-chart";
import { compactNumber, money, rating } from "@/lib/format";
import type { RawParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

function first(params: RawParams, key: string, fallback: string): string {
  const value = params[key];
  if (value === undefined) return fallback;
  return (Array.isArray(value) ? value[0] : value) || fallback;
}

export default async function RankingsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const rows = queryRankings({
    store: first(params, "store", "ios"),
    chart: first(params, "chart", "free"),
    country: first(params, "country", "us"),
  });

  const history = rankHistory(rows.map((row) => row.app.id));

  return (
    <div className="pb-12">
      <PageHeader title="Store Rankings" subtitle="Browse top charts by country and store." />
      <RankingsControls countries={rankingCountries()} />

      <div className="px-7 pt-5">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center text-sm text-ink-muted">
            No chart data for this combination yet.
          </div>
        ) : (
          <ol className="grid gap-2 lg:grid-cols-2">
            {rows.map(({ position, app }) => (
              <li
                key={app.id}
                className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3"
              >
                <span className="w-7 shrink-0 text-right text-[15px] font-semibold tabular-nums text-ink-faint">
                  {position}
                </span>
                <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-10" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
                    className="block truncate text-[14px] font-medium hover:text-accent-ink"
                  >
                    {app.title}
                  </Link>
                  <span className="block truncate text-[12px] text-ink-muted">
                    {app.developer} · {app.category}
                  </span>
                </div>
                <MiniChart
                  values={history.get(app.id) ?? []}
                  label={`Chart position history for ${app.title}`}
                  className="h-8 w-20 shrink-0"
                />
                <span className="inline-flex shrink-0 items-center gap-1 text-[13px]">
                  <Star className="size-3.5 text-accent" />
                  {rating(app.rating)}
                </span>
                <span className="w-16 shrink-0 text-right text-[13px] tabular-nums text-ink-muted">
                  {compactNumber(app.estDownloads)}
                </span>
                <span className="w-16 shrink-0 text-right text-[13px] tabular-nums">
                  {money(app.estMrr)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
