"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useFilterParams } from "@/components/filters/use-filter-params";
import { cn } from "@/lib/cn";

/**
 * Sorting from the column you are reading, rather than from a popover that hides
 * both the current sort and the alternatives.
 */
export function SortableHeader({
  label,
  sortKey,
  align = "left",
  defaultKey,
}: {
  label: string;
  sortKey: string;
  align?: "left" | "right";
  defaultKey?: string;
}) {
  const { get, set } = useFilterParams();
  const current = get("sort") ?? defaultKey;
  const dir = get("dir") === "asc" ? "asc" : "desc";
  const active = current === sortKey;

  const toggle = () => {
    if (!active) {
      set({ sort: sortKey, dir: null });
      return;
    }
    set({ sort: sortKey, dir: dir === "desc" ? "asc" : null });
  };

  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn("px-4 py-3 font-medium", align === "right" && "text-right")}
    >
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "inline-flex items-center gap-1 rounded-md transition-colors hover:text-ink",
          align === "right" && "flex-row-reverse",
          active && "text-ink",
        )}
        title={active ? `Sorted ${dir === "asc" ? "ascending" : "descending"}` : `Sort by ${label}`}
      >
        {label}
        <Icon className={cn("size-3", active ? "opacity-90" : "opacity-40")} />
      </button>
    </th>
  );
}
