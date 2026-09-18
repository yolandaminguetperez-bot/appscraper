"use client";

import { X } from "lucide-react";
import { useFilterParams } from "@/components/filters/use-filter-params";

/** The chips remove one filter each; this is the way out of a dead-end search. */
export function ClearFilters({ count }: { count: number }) {
  const { clearAll } = useFilterParams();
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={clearAll}
      className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
    >
      <X className="size-3.5" />
      Clear {count} {count === 1 ? "filter" : "filters"}
    </button>
  );
}
