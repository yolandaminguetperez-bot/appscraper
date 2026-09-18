import Link from "next/link";
import type { App } from "@/lib/types";
import { compactNumber, daysAgo, money, rating } from "@/lib/format";
import { AppIcon } from "@/components/ui/app-icon";
import { MiniChart } from "@/components/charts/mini-chart";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { IconSprite, SpriteIcon, SPRITE_IDS } from "@/components/ui/icon-sprite";

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
          <article key={app.id} className="rounded-2xl border border-line bg-surface p-4">
            <header className="flex items-start gap-3">
              <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-12" />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
                  className="block truncate text-[14.5px] font-medium hover:text-accent-ink"
                >
                  {app.title}
                </Link>
                <p className="truncate text-[12.5px] text-ink-muted">{app.developer}</p>
                <p className="flex items-center gap-1.5 pt-1 text-[11.5px] text-ink-faint">
                  <SpriteIcon
                    id={app.store === "ios" ? SPRITE_IDS.apple : SPRITE_IDS.play}
                    className="size-3"
                  />
                  {app.category ?? "—"}
                </p>
              </div>
              <FavoriteButton kind="app" refId={app.id} initial={favorites.has(app.id)} />
            </header>

            <dl className="grid grid-cols-3 gap-2 pt-3.5 text-[12px]">
              <div>
                <dt className="text-ink-faint">Rating</dt>
                <dd className="flex items-center gap-1 font-medium">
                  <SpriteIcon id={SPRITE_IDS.star} className="size-3 text-accent" />
                  {rating(app.rating)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-faint">Downloads</dt>
                <dd className="font-medium tabular-nums">{compactNumber(app.estDownloads)}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">MRR</dt>
                <dd className="font-medium tabular-nums">{money(app.estMrr)}</dd>
              </div>
            </dl>

            <div className="flex items-end justify-between gap-3 pt-3">
              <MiniChart
                values={trends?.get(app.id) ?? []}
                label={`Revenue trend for ${app.title}`}
                className="h-9 w-32"
              />
              <p className="text-right text-[11.5px] text-ink-faint">
                {compactNumber(app.ratingCount)} reviews
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
