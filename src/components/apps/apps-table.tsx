import Link from "next/link";
import type { App } from "@/lib/types";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { AppIcon } from "@/components/ui/app-icon";
import { MiniChart } from "@/components/charts/mini-chart";
import { SpriteIcon, SPRITE_IDS } from "@/components/ui/icon-sprite";
import { SortableHeader } from "@/components/filters/sortable-header";
import { SelectCheckbox } from "@/components/selection/select-checkbox";
import { QuickLookButton } from "@/components/quicklook/quick-look-button";
import { compactNumber, daysAgo, money, rating } from "@/lib/format";

function StoreBadge({ store }: { store: App["store"] }) {
  return (
    <span
      title={store === "ios" ? "App Store" : "Google Play"}
      className="grid size-6 place-items-center rounded-md bg-surface-muted text-ink-muted"
    >
      <SpriteIcon id={store === "ios" ? SPRITE_IDS.apple : SPRITE_IDS.play} className="size-3.5" />
    </span>
  );
}

export function AppsTable({
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
    <div className="surface-card scroll-thin overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-muted/60 text-left text-[12px] uppercase tracking-wide text-ink-muted">
            <th scope="col" className="w-9 py-3 pl-4 pr-0">
              <span className="sr-only">Select</span>
            </th>
            <SortableHeader label="App" sortKey="title" defaultKey="revenue" />
            <th scope="col" className="px-4 py-3 font-medium">Category</th>
            <SortableHeader label="Rating" sortKey="rating" align="right" defaultKey="revenue" />
            <SortableHeader label="Reviews" sortKey="reviews" align="right" defaultKey="revenue" />
            <SortableHeader label="Downloads" sortKey="downloads" align="right" defaultKey="revenue" />
            <th scope="col" className="px-4 py-3 text-right font-medium">MRR</th>
            <th scope="col" className="px-4 py-3 font-medium">Revenue, 30d</th>
            <SortableHeader label="Revenue" sortKey="revenue" align="right" defaultKey="revenue" />
            <SortableHeader label="Released" sortKey="released" align="right" defaultKey="revenue" />
            <th className="w-20 px-2 py-3" />
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr key={app.id} className="border-b border-line last:border-0 hover:bg-surface-muted/40">
              <td className="py-3 pl-4 pr-0">
                <SelectCheckbox id={app.id} title={app.title} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-9" />
                  <StoreBadge store={app.store} />
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
                      className="block truncate font-medium hover:text-accent-ink"
                    >
                      {app.title}
                    </Link>
                    {app.developer ? (
                      <Link
                        href={`/dashboard/developers/${encodeURIComponent(app.developer)}`}
                        className="block truncate text-[12px] text-ink-muted hover:text-accent-ink"
                      >
                        {app.developer}
                      </Link>
                    ) : (
                      <span className="block truncate text-[12px] text-ink-muted">—</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-[13px] text-ink-muted">{app.category ?? "—"}</td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1">
                  <SpriteIcon id={SPRITE_IDS.star} className="size-3.5 text-accent" />
                  {rating(app.rating)}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{compactNumber(app.ratingCount)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{compactNumber(app.estDownloads)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{money(app.estMrr)}</td>
              <td className="px-4 py-2">
                <MiniChart
                  values={trends?.get(app.id) ?? []}
                  label={`Revenue trend for ${app.title}`}
                />
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{money(app.estRevenue)}</td>
              <td className="px-4 py-3 text-right text-[13px] text-ink-muted">{daysAgo(app.releasedAt)}</td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-0.5">
                  <QuickLookButton id={app.id} title={app.title} />
                  <FavoriteButton kind="app" refId={app.id} initial={favorites.has(app.id)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
