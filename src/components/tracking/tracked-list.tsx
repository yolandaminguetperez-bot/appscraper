"use client";

import Link from "next/link";
import { Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { untrackAppAction } from "@/app/actions/tracking";
import { compactNumber, daysAgo, money, rating } from "@/lib/format";
import { AppIcon } from "@/components/ui/app-icon";
import type { App } from "@/lib/types";

export type TrackedEntry = { app: App; role: "own" | "competitor"; addedAt: string };

export function TrackedList({ entries, empty }: { entries: TrackedEntry[]; empty: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center text-sm text-ink-muted">
        {empty}
      </div>
    );
  }

  return (
    <ul className="surface-card overflow-hidden">
      {entries.map(({ app, addedAt }) => (
        <li key={app.id} className="flex items-center gap-4 border-b border-line px-5 py-3 last:border-0">
          <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-9" />
          <div className="min-w-0 flex-1">
            <Link
              href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
              className="block truncate text-[14px] font-medium hover:text-accent-ink"
            >
              {app.title}
            </Link>
            <span className="block truncate text-[12px] text-ink-muted">
              {app.developer} · {app.category} · added {daysAgo(addedAt)}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[13px]">
            <Star className="size-3.5 text-accent" />
            {rating(app.rating)}
          </span>
          <span className="w-20 text-right text-[13px] tabular-nums text-ink-muted">
            {compactNumber(app.estDownloads)}
          </span>
          <span className="w-16 text-right text-[13px] tabular-nums">{money(app.estMrr)}</span>
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
            className="grid size-7 place-items-center rounded-full text-ink-faint hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
