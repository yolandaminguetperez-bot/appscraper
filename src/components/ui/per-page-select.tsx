"use client";

import { useFilterParams } from "@/components/filters/use-filter-params";

export function PerPageSelect({
  value,
  options,
}: {
  value: number;
  options: number[];
}) {
  const { set } = useFilterParams();
  const id = "per-page";

  return (
    <label htmlFor={id} className="flex items-center gap-2 text-[13px] text-ink-muted">
      <span className="hidden sm:inline">Per page</span>
      <select
        id={id}
        value={String(value)}
        onChange={(event) => set({ perPage: event.target.value })}
        className="rounded-lg border border-line bg-surface px-2 py-1 text-[13px] text-ink"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
