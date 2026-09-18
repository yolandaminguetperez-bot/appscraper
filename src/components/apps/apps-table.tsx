import Link from "next/link";
import { Apple, Play, Star } from "lucide-react";
import type { App } from "@/lib/types";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { compactNumber, daysAgo, money, rating } from "@/lib/format";

function StoreBadge({ store }: { store: App["store"] }) {
  const Icon = store === "ios" ? Apple : Play;
  return (
    <span
      title={store === "ios" ? "App Store" : "Google Play"}
      className="grid size-6 place-items-center rounded-md bg-surface-muted text-ink-muted"
    >
      <Icon className="size-3.5" />
    </span>
  );
}

export function AppsTable({ apps, favorites }: { apps: App[]; favorites: Set<string> }) {
  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center">
        <p className="text-sm font-medium">No apps match these filters</p>
        <p className="mt-1 text-[13px] text-ink-muted">Loosen a filter or clear them all to start over.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-muted/60 text-left text-[12px] uppercase tracking-wide text-ink-muted">
            <th className="px-4 py-3 font-medium">App</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 text-right font-medium">Rating</th>
            <th className="px-4 py-3 text-right font-medium">Reviews</th>
            <th className="px-4 py-3 text-right font-medium">Downloads</th>
            <th className="px-4 py-3 text-right font-medium">MRR</th>
            <th className="px-4 py-3 text-right font-medium">Revenue</th>
            <th className="px-4 py-3 text-right font-medium">Released</th>
            <th className="w-10 px-2 py-3" />
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr key={app.id} className="border-b border-line last:border-0 hover:bg-surface-muted/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <StoreBadge store={app.store} />
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
                      className="block truncate font-medium hover:text-accent-ink"
                    >
                      {app.title}
                    </Link>
                    <span className="block truncate text-[12px] text-ink-muted">{app.developer}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-[13px] text-ink-muted">{app.category ?? "—"}</td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 text-accent" />
                  {rating(app.rating)}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{compactNumber(app.ratingCount)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{compactNumber(app.estDownloads)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{money(app.estMrr)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{money(app.estRevenue)}</td>
              <td className="px-4 py-3 text-right text-[13px] text-ink-muted">{daysAgo(app.releasedAt)}</td>
              <td className="px-2 py-3">
                <FavoriteButton kind="app" refId={app.id} initial={favorites.has(app.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
