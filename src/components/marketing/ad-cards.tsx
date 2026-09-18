import Link from "next/link";
import type { AdGroup } from "@/lib/db/marketing-query";
import { compactNumber, money } from "@/lib/format";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { AppIcon } from "@/components/ui/app-icon";
import { CreativeGrid, type CreativeWithApp } from "@/components/marketing/creative-grid";

export function AdGroupCard({ group, favorites }: { group: AdGroup; favorites: Set<string> }) {
  const { app, creatives, total } = group;

  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <header className="flex items-start justify-between gap-3">
        <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-10" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
            className="block truncate font-medium hover:text-accent-ink"
          >
            {app.title}
          </Link>
          <p className="truncate text-[12.5px] text-ink-muted">{app.developer}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11.5px] font-medium text-accent-ink">
            {total} {total === 1 ? "ad" : "ads"}
          </span>
          <FavoriteButton kind="app" refId={app.id} initial={favorites.has(app.id)} />
        </div>
      </header>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
        <div>
          <dt className="text-ink-faint">MRR</dt>
          <dd className="font-medium tabular-nums">{money(app.estMrr)}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Downloads</dt>
          <dd className="font-medium tabular-nums">{compactNumber(app.estDownloads)}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Category</dt>
          <dd className="truncate font-medium">{app.category ?? "—"}</dd>
        </div>
      </dl>

      <div className="mt-3">
        <CreativeGrid
          creatives={creatives.map((c) => ({ ...c, appTitle: app.title, appDeveloper: app.developer }))}
          columns="grid grid-cols-4 gap-2"
        />
      </div>
    </article>
  );
}

export function CreativeCards({
  creatives,
  savedIds,
}: {
  creatives: CreativeWithApp[];
  savedIds: Set<string>;
}) {
  return <CreativeGrid creatives={creatives} footer="app" savedIds={[...savedIds]} />;
}
