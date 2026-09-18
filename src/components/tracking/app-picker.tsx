"use client";

import { Search } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFilterParams } from "@/components/filters/use-filter-params";
import { trackAppAction } from "@/app/actions/tracking";
import type { App } from "@/lib/types";
import { compactNumber } from "@/lib/format";

export function AppPicker({ role, results }: { role: "own" | "competitor"; results: App[] }) {
  const router = useRouter();
  const { get, set } = useFilterParams();
  const onSearch = (term: string) => set({ q: term || null });
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5">
        <Search className="size-4 shrink-0 text-ink-faint" />
        <input
          defaultValue={get("q") ?? ""}
          placeholder="Search the catalogue by app name…"
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch((e.target as HTMLInputElement).value.trim());
          }}
          onBlur={(e) => onSearch(e.target.value.trim())}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </div>

      {results.length > 0 && (
        <ul className="surface-card overflow-hidden">
          {results.map((app) => (
            <li
              key={app.id}
              className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{app.title}</p>
                <p className="truncate text-[12px] text-ink-muted">
                  {app.developer} · {app.category} · {compactNumber(app.ratingCount)} reviews
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await trackAppAction(app.id, role);
                    setAdded(app.id);
                    router.refresh();
                  })
                }
                className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-medium text-panel hover:bg-accent-ink hover:text-white disabled:opacity-60"
              >
                {added === app.id ? "Added" : role === "own" ? "Add app" : "Track"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
