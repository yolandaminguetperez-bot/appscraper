import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import type { TrendRow } from "@/lib/db/trends-query";
import { compactNumber, daysAgo, money, rating } from "@/lib/format";
import { AppIcon } from "@/components/ui/app-icon";
import { MiniChart } from "@/components/charts/mini-chart";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { SelectCheckbox } from "@/components/selection/select-checkbox";
import { QuickLookButton } from "@/components/quicklook/quick-look-button";

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.06em] text-ink-faint">{label}</dt>
      <dd className={`pt-0.5 text-[15px] font-semibold tabular-nums ${accent ? "text-accent-ink" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

/** The trending table laid out as cards; the rank stays visible because the
 *  order is the whole point of this view. */
export function TrendGrid({
  rows,
  trends,
  favorites,
}: {
  rows: TrendRow[];
  trends?: Map<string, number[]>;
  favorites: Set<string>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center text-sm text-ink-muted">
        Not enough history yet for this window.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {rows.map((row, index) => (
        <article
          key={row.app.id}
          className="surface-card surface-card-interactive flex flex-col overflow-hidden"
        >
          <header className="flex items-start gap-3.5 p-5 pb-4">
            <div className="relative shrink-0">
              <AppIcon
                id={row.app.id}
                title={row.app.title}
                iconUrl={row.app.iconUrl}
                className="size-[52px] shadow-[0_6px_16px_-8px_rgba(16,21,17,0.5)]"
              />
              <span className="absolute -left-1.5 -top-1.5 grid size-6 place-items-center rounded-full border border-line bg-surface text-[11.5px] font-semibold tabular-nums text-ink-muted">
                {index + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/apps/${encodeURIComponent(row.app.id)}`}
                className="block truncate text-[16px] font-semibold leading-tight tracking-tight hover:text-accent-ink"
              >
                {row.app.title}
              </Link>
              {row.app.developer ? (
                <Link
                  href={`/dashboard/developers/${encodeURIComponent(row.app.developer)}`}
                  className="block truncate pt-0.5 text-[13px] text-ink-muted hover:text-accent-ink"
                >
                  {row.app.developer}
                </Link>
              ) : null}
              <p className="flex items-center gap-1.5 pt-2">
                <span className="inline-flex min-w-0 items-center rounded-full bg-surface-muted px-2 py-0.5 text-[11.5px] text-ink-muted">
                  <span className="truncate">{row.app.category ?? "—"}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-accent-ink">
                  <Star className="size-3" />
                  {rating(row.app.rating)}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SelectCheckbox id={row.app.id} title={row.app.title} />
              <QuickLookButton id={row.app.id} title={row.app.title} />
              <FavoriteButton kind="app" refId={row.app.id} initial={favorites.has(row.app.id)} />
            </div>
          </header>

          <dl className="grid grid-cols-3 gap-3 border-t border-line px-5 py-3.5">
            <Metric label="Growth" value={`${(row.growth * 100).toFixed(1)}%`} accent />
            <Metric label="Reviews gained" value={compactNumber(row.gained)} />
            <Metric label="MRR" value={money(row.app.estMrr)} />
          </dl>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-line bg-surface-muted/40 px-5 py-3">
            <MiniChart
              values={trends?.get(row.app.id) ?? []}
              label={`Downloads trend for ${row.app.title}`}
              className="h-9 w-28"
            />
            <p className="flex items-center gap-1 text-right text-[11.5px] leading-tight text-ink-faint">
              <ArrowUpRight className="size-3" />
              released {daysAgo(row.app.releasedAt)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
