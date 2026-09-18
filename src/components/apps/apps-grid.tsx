import Link from "next/link";
import type { App } from "@/lib/types";
import { compactNumber, daysAgo, money, rating } from "@/lib/format";
import { AppIcon } from "@/components/ui/app-icon";
import { MiniChart } from "@/components/charts/mini-chart";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { IconSprite, SpriteIcon, SPRITE_IDS } from "@/components/ui/icon-sprite";

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.06em] text-ink-faint">{label}</dt>
      <dd
        className={`pt-0.5 text-[15px] font-semibold tabular-nums ${accent ? "text-accent-ink" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

/** The same rows as the table, laid out for scanning artwork rather than columns. */
export function AppsGrid({
  apps,
  favorites,
  trends,
}: {
  apps: App[];
  favorites: Set<string>;
  trends?: Map<string, number[]>;
}) {
  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center">
        <p className="text-sm font-medium">No apps match these filters</p>
        <p className="mt-1 text-[13px] text-ink-muted">Loosen a filter or clear them all to start over.</p>
      </div>
    );
  }

  return (
    <>
      <IconSprite />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {apps.map((app) => (
          <article
            key={app.id}
            className="surface-card surface-card-interactive flex flex-col overflow-hidden"
          >
            <header className="flex items-start gap-3.5 p-5 pb-4">
              <AppIcon
                id={app.id}
                title={app.title}
                iconUrl={app.iconUrl}
                className="size-[52px] shadow-[0_6px_16px_-8px_rgba(16,21,17,0.5)]"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
                  className="block truncate text-[16px] font-semibold leading-tight tracking-tight hover:text-accent-ink"
                >
                  {app.title}
                </Link>
                <p className="truncate pt-0.5 text-[13px] text-ink-muted">{app.developer}</p>
                <p className="flex items-center gap-1.5 pt-2">
                  {/* Long category names wrapped the badge and made one card
                      taller than its neighbours. */}
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-surface-muted px-2 py-0.5 text-[11.5px] text-ink-muted">
                    <SpriteIcon
                      id={app.store === "ios" ? SPRITE_IDS.apple : SPRITE_IDS.play}
                      className="size-3"
                    />
                    <span className="truncate">{app.category ?? "—"}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-accent-ink">
                    <SpriteIcon id={SPRITE_IDS.star} className="size-3" />
                    {rating(app.rating)}
                  </span>
                </p>
              </div>
              <FavoriteButton kind="app" refId={app.id} initial={favorites.has(app.id)} />
            </header>

            <dl className="grid grid-cols-3 gap-3 border-t border-line px-5 py-3.5">
              <Metric label="Downloads" value={compactNumber(app.estDownloads)} />
              <Metric label="MRR" value={money(app.estMrr)} accent />
              <Metric label="Reviews" value={compactNumber(app.ratingCount)} />
            </dl>

            <div className="mt-auto flex items-end justify-between gap-3 border-t border-line bg-surface-muted/40 px-5 py-3">
              <MiniChart
                values={trends?.get(app.id) ?? []}
                label={`Revenue trend for ${app.title}`}
                className="h-9 w-28"
              />
              <p className="text-right text-[11.5px] leading-tight text-ink-faint">
                {money(app.estRevenue)} lifetime
                <br />
                released {daysAgo(app.releasedAt)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
