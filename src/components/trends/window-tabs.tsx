"use client";

import { useFilterParams } from "@/components/filters/use-filter-params";
import { cn } from "@/lib/cn";

export function WindowTabs({ options }: { options: { value: string; label: string }[] }) {
  const { get, set } = useFilterParams();
  const current = get("window") ?? options[0].value;

  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => set({ window: option.value === options[0].value ? null : option.value })}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-[12.5px]",
            current === option.value ? "bg-accent-soft text-accent-ink" : "text-ink-muted hover:text-ink",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
