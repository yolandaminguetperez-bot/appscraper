"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { untrackAppAction } from "@/app/actions/tracking";
import { AppIcon } from "@/components/ui/app-icon";
import { TrackedNote } from "@/components/tracking/tracked-note";
import { MiniChart } from "@/components/charts/mini-chart";
import { compactNumber, daysAgo, money, rating } from "@/lib/format";
import type { App } from "@/lib/types";

export type TrackedEntry = { app: App; role: "own" | "competitor"; addedAt: string; note: string | null };

/** Tracked apps deserve the same card as everywhere else, not a bare row. */
export function TrackedGrid({
  entries,
  trends,
  empty,
  emptyAction,
}: {
  entries: TrackedEntry[];
  trends?: Map<string, number[]>;
  empty: { title: string; body: string };
  emptyAction?: { href: string; label: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/70 px-6 py-14 text-center">
        <p className="text-[15px] font-medium">{empty.title}</p>
        <p className="mx-auto max-w-sm pt-1.5 text-[13px] leading-relaxed text-ink-muted">{empty.body}</p>
        {emptyAction && (
          <Link
            href={emptyAction.href}
            className="mt-5 inline-flex rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-panel hover:bg-accent-ink hover:text-white"
          >
            {emptyAction.label}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map(({ app, addedAt, note }) => (
        <article key={app.id} className="surface-card surface-card-interactive p-4">
          <header className="flex items-start gap-3">
            <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-11" />
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
                className="block truncate text-[15px] font-semibold hover:text-accent-ink"
              >
                {app.title}
              </Link>
              <p className="truncate text-[12.5px] text-ink-muted">
                {app.developer} · {app.category}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              aria-label={`Stop tracking ${app.title}`}
              onClick={() =>
                startTransition(async () => {
                  await untrackAppAction(app.id);
                  router.refresh();
                })
              }
              className="grid size-7 shrink-0 place-items-center rounded-full text-ink-faint hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </header>

          <dl className="grid grid-cols-3 gap-2 pt-3.5 text-[12px]">
            <div>
              <dt className="text-ink-faint">Rating</dt>
              <dd className="pt-0.5 font-semibold">{rating(app.rating)}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Downloads</dt>
              <dd className="pt-0.5 font-semibold tabular-nums">{compactNumber(app.estDownloads)}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">MRR</dt>
              <dd className="pt-0.5 font-semibold tabular-nums text-accent-ink">{money(app.estMrr)}</dd>
            </div>
          </dl>

          <div className="flex items-end justify-between gap-3 pt-3">
            <MiniChart
              values={trends?.get(app.id) ?? []}
              label={`Revenue trend for ${app.title}`}
              className="h-8 w-28"
            />
            <p className="text-right text-[11.5px] text-ink-faint">tracked {daysAgo(addedAt)}</p>
          </div>

          <TrackedNote appId={app.id} initial={note} />
        </article>
      ))}
    </div>
  );
}
