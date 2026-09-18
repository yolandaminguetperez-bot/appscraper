"use client";

import { Search } from "lucide-react";
import { useFilterParams } from "@/components/filters/use-filter-params";
import { cn } from "@/lib/cn";

export function KeywordSearch({ initial, suggestions }: { initial: string; suggestions: string[] }) {
  const { set } = useFilterParams();

  return (
    <div className="px-7 pt-5">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5">
        <Search className="size-4 shrink-0 text-ink-faint" />
        <input
          defaultValue={initial}
          placeholder="Try a term users would type, like “budget” or “habit”…"
          onKeyDown={(e) => {
            if (e.key === "Enter") set({ term: (e.target as HTMLInputElement).value.trim() || null });
          }}
          onBlur={(e) => set({ term: e.target.value.trim() || null })}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {suggestions.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => set({ term })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12px]",
              term === initial
                ? "border-accent/40 bg-accent-soft text-accent-ink"
                : "border-line bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
