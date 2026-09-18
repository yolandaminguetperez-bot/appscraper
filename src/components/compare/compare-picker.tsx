"use client";

import { Plus, Search, X } from "lucide-react";
import { useFilterParams } from "@/components/filters/use-filter-params";
import { AppIcon } from "@/components/ui/app-icon";
import type { App } from "@/lib/types";
import { MAX_APPS } from "@/lib/compare";

export function ComparePicker({
  results,
  selected,
}: {
  results: App[];
  selected: { id: string; title: string; iconUrl?: string | null }[];
}) {
  const { get, getAll, set } = useFilterParams();
  const ids = getAll("app");
  const full = ids.length >= MAX_APPS;

  return (
    <div className="space-y-3 px-7 pt-5">
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((app) => (
          <span
            key={app.id}
            className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 text-[12.5px]"
          >
            <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-6" />
            {app.title}
            <button
              type="button"
              onClick={() => set({ app: ids.filter((id) => id !== app.id) })}
              aria-label={`Remove ${app.title} from the comparison`}
              className="text-ink-faint hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <p className="text-[13px] text-ink-muted">Nothing picked yet — search below.</p>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5">
        <Search className="size-4 shrink-0 text-ink-faint" />
        <input
          defaultValue={get("q") ?? ""}
          placeholder={full ? `Remove one to add another (max ${MAX_APPS})` : "Search an app to add…"}
          disabled={full}
          onKeyDown={(e) => {
            if (e.key === "Enter") set({ q: (e.target as HTMLInputElement).value.trim() || null });
          }}
          onBlur={(e) => set({ q: e.target.value.trim() || null })}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint disabled:opacity-60"
        />
      </div>

      {results.length > 0 && !full && (
        <ul className="surface-card overflow-hidden">
          {results.map((app) => {
            const already = ids.includes(app.id);
            return (
              <li
                key={app.id}
                className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0"
              >
                <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{app.title}</p>
                  <p className="truncate text-[12px] text-ink-muted">
                    {app.developer} · {app.category}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={already}
                  onClick={() => set({ app: [...ids, app.id], q: null })}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[12.5px] font-medium text-panel hover:bg-accent-ink hover:text-white disabled:opacity-50"
                >
                  <Plus className="size-3.5" />
                  {already ? "Added" : "Compare"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
