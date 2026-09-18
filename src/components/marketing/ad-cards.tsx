import Link from "next/link";
import { Clock3, Film, Globe2, Image as ImageIcon } from "lucide-react";
import type { AdGroup, Creative } from "@/lib/db/marketing-query";
import { compactNumber, daysAgo, money } from "@/lib/format";

function CreativeThumb({ creative }: { creative: Creative }) {
  const Icon = creative.kind === "video" ? Film : ImageIcon;
  return (
    <div className="relative flex aspect-[9/14] flex-col justify-end rounded-xl bg-panel p-3 text-panel-ink">
      <Icon className="absolute left-3 top-3 size-4 opacity-40" />
      <p className="line-clamp-3 text-[12.5px] leading-snug">{creative.headline}</p>
      <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-panel-ink-muted">
        <Clock3 className="size-3" />
        {creative.daysRunning ?? 0}d running
      </p>
    </div>
  );
}

export function AdGroupCard({ group }: { group: AdGroup }) {
  const { app, creatives, total } = group;

  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
            className="block truncate font-medium hover:text-accent-ink"
          >
            {app.title}
          </Link>
          <p className="truncate text-[12.5px] text-ink-muted">{app.developer}</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[11.5px] font-medium text-accent-ink">
          {total} {total === 1 ? "ad" : "ads"}
        </span>
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

      <div className="mt-3 grid grid-cols-4 gap-2">
        {creatives.map((creative) => (
          <CreativeThumb key={creative.id} creative={creative} />
        ))}
      </div>
    </article>
  );
}

export function CreativeCard({
  creative,
}: {
  creative: Creative & { appTitle: string; appDeveloper: string | null };
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface">
      <CreativeThumb creative={creative} />
      <div className="space-y-1.5 p-3">
        <Link
          href={`/dashboard/apps/${encodeURIComponent(creative.appId)}`}
          className="block truncate text-[13px] font-medium hover:text-accent-ink"
        >
          {creative.appTitle}
        </Link>
        <p className="line-clamp-2 text-[12px] text-ink-muted">{creative.body}</p>
        <div className="flex items-center justify-between pt-1 text-[11.5px] text-ink-faint">
          <span className="inline-flex items-center gap-1">
            <Globe2 className="size-3" />
            {creative.countries.join(", ").toUpperCase() || "—"}
          </span>
          <span>last seen {daysAgo(creative.lastSeen)}</span>
        </div>
      </div>
    </article>
  );
}
