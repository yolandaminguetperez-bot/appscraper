"use client";

import { LayoutGrid, Rows3 } from "lucide-react";
import { useFilterParams } from "@/components/filters/use-filter-params";
import { cn } from "@/lib/cn";

export function ViewToggle() {
  const { get, set } = useFilterParams();
  const view = get("view") === "grid" ? "grid" : "table";

  return (
    <div role="group" aria-label="Layout" className="flex items-center rounded-full bg-surface-muted p-1">
      {[
        { value: "table", label: "Table", Icon: Rows3 },
        { value: "grid", label: "Cards", Icon: LayoutGrid },
      ].map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => set({ view: value === "table" ? null : value })}
          aria-pressed={view === value}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px]",
            view === value ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
