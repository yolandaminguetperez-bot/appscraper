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
      className="grid size-5 place-items-center rounded-md bg-surface-muted text-ink-faint"
    >
      <SpriteIcon id={store === "ios" ? SPRITE_IDS.apple : SPRITE_IDS.play} className="size-3" />
    </span>
  );
}

/**
 * A number with a bar behind it showing its share of the largest value on
 * screen. A column of formatted numbers is read one at a time; the same column
 * with magnitude behind it is read at a glance.
 *
 * Exactly one column gets it: the one the table is sorted by, which is the
 * ranking the reader asked for. Bars on every numeric column turn the table
 * into wallpaper, and on a skewed column like MRR — where one app carries 25M
 * against everyone else's 2M — every bar but the outlier's collapses to a
 * sliver that reads as a rendering fault.
 */
function Magnitude({
  value,
  peak,
  format,
  strong,
}: {
  value: number | null | undefined;
  peak: number;
  format: (value: number | null | undefined) => string;
  strong?: boolean;
}) {
  const share = value && peak > 0 ? Math.max(0.02, Math.min(1, value / peak)) : 0;

  return (
    <span className="relative flex h-6 items-center justify-end">
      <span
        aria-hidden
        className="absolute inset-y-0 right-0 rounded-[4px] bg-accent/10"
        style={{ width: `${share * 100}%` }}
      />
      <span
        className={`num relative px-1.5 ${strong ? "text-[13.5px] font-semibold" : "text-[13px] text-ink-muted"}`}
      >
        {format(value)}
      </span>
    </span>
  );
}

export function AppsTable({
  apps,
  favorites,
  trends,
  sortKey = "revenue",
}: {
  apps: App[];
  favorites: Set<string>;
  trends?: Map<string, number[]>;
  sortKey?: string;
}) {
  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center">
        <p className="text-sm font-medium">No apps match these filters</p>
        <p className="mt-1 text-[13px] text-ink-muted">Loosen a filter or clear them all to start over.</p>
      </div>
    );
  }

  // Sorting by a non-numeric column still leaves revenue as the page's headline
  // figure, so that is where the bar goes.
  const barColumn = ["revenue", "downloads", "reviews"].includes(sortKey) ? sortKey : "revenue";

  // The peak comes from what is on screen, so the bars compare this page's rows
  // rather than the whole catalogue, which would flatten every page but the first.
  const peak = Math.max(
    ...apps.map((app) =>
      barColumn === "downloads"
        ? app.estDownloads ?? 0
        : barColumn === "reviews"
          ? app.ratingCount ?? 0
          : app.estRevenue ?? 0,
    ),
    1,
  );

  return (
    <div className="scroll-thin overflow-x-auto rounded-2xl border border-line bg-surface shadow-[var(--raise-1)]">
      <table className="w-full min-w-[920px] border-collapse text-sm">
        <thead>
          {/* Sticky: the columns stay labelled while you scroll a long page. */}
          <tr className="sticky top-0 z-10 bg-surface/95 text-left backdrop-blur [&_th]:border-b [&_th]:border-line [&_th]:py-2.5 [&_th]:align-bottom [&_th]:text-[10.5px] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.07em] [&_th]:text-ink-faint">
            <th scope="col" className="w-9 pl-4 pr-0">
              <span className="sr-only">Select</span>
            </th>
            <SortableHeader label="App" sortKey="title" defaultKey="revenue" />
            <th scope="col" className="px-4">Category</th>
            <SortableHeader label="Rating" sortKey="rating" align="right" defaultKey="revenue" />
            <SortableHeader label="Reviews" sortKey="reviews" align="right" defaultKey="revenue" />
            <SortableHeader label="Downloads" sortKey="downloads" align="right" defaultKey="revenue" />
            <th scope="col" className="px-4 text-right">MRR</th>
            <th scope="col" className="px-4">Revenue, 30d</th>
            <SortableHeader label="Revenue" sortKey="revenue" align="right" defaultKey="revenue" />
            <SortableHeader label="Released" sortKey="released" align="right" defaultKey="revenue" />
            <th className="w-[72px] px-2" />
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr
              key={app.id}
              className="group border-b border-line/70 last:border-0 transition-colors hover:bg-surface-muted/50"
            >
              <td className="py-2.5 pl-4 pr-0">
                <SelectCheckbox id={app.id} title={app.title} />
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-9" />
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <Link
                        href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
                        className="truncate text-[13.5px] font-semibold tracking-[-0.01em] hover:text-accent-ink"
                      >
                        {app.title}
                      </Link>
                      <StoreBadge store={app.store} />
                    </span>
                    {app.developer ? (
                      <Link
                        href={`/dashboard/developers/${encodeURIComponent(app.developer)}`}
                        className="block truncate text-[11.5px] text-ink-faint hover:text-accent-ink"
                      >
                        {app.developer}
                      </Link>
                    ) : (
                      <span className="block truncate text-[11.5px] text-ink-faint">—</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-2.5">
                {/* A category is a filter you already have — clicking it beats
                    finding the same value in the filter bar. */}
                {app.category ? (
                  <Link
                    href={`/dashboard/apps?cat=${encodeURIComponent(app.category)}`}
                    className="rounded-full bg-surface-muted px-2 py-0.5 text-[11.5px] text-ink-muted transition-colors hover:text-accent-ink"
                  >
                    {app.category}
                  </Link>
                ) : (
                  <span className="text-[12px] text-ink-faint">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className="inline-flex items-center gap-1 text-[13px]">
                  <SpriteIcon id={SPRITE_IDS.star} className="size-3 text-accent" />
                  <span className="num">{rating(app.rating)}</span>
                </span>
              </td>
              <td className="px-3 py-2.5">
                {barColumn === "reviews" ? (
                  <Magnitude value={app.ratingCount} peak={peak} format={compactNumber} strong />
                ) : (
                  <span className="block text-right num text-[13px] text-ink-muted">
                    {compactNumber(app.ratingCount)}
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5">
                {barColumn === "downloads" ? (
                  <Magnitude value={app.estDownloads} peak={peak} format={compactNumber} strong />
                ) : (
                  <span className="block text-right num text-[13px] text-ink-muted">
                    {compactNumber(app.estDownloads)}
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right num text-[13px] text-ink-muted">
                {money(app.estMrr)}
              </td>
              <td className="px-4 py-1.5">
                <MiniChart
                  values={trends?.get(app.id) ?? []}
                  label={`Revenue trend for ${app.title}`}
                />
              </td>
              <td className="px-3 py-2.5">
                {barColumn === "revenue" ? (
                  <Magnitude value={app.estRevenue} peak={peak} format={money} strong />
                ) : (
                  <span className="block text-right num text-[13.5px] font-semibold">
                    {money(app.estRevenue)}
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right text-[12px] text-ink-faint">
                {daysAgo(app.releasedAt)}
              </td>
              <td className="px-2 py-2.5">
                {/* Quiet at rest, available on hover — and always available to a
                    keyboard, which never triggers hover. */}
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [&:has(:is([aria-pressed=true]))]:opacity-100">
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
