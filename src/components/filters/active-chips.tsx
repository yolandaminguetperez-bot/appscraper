"use client";

import { X } from "lucide-react";
import { useFilterParams } from "@/components/filters/use-filter-params";
import { ClearFilters } from "@/components/filters/clear-filters";

export type ActiveChip = { key: string; value?: string; label: string };

export function ActiveChips({ chips }: { chips: ActiveChip[] }) {
  const { params, set } = useFilterParams();

  if (chips.length === 0) return null;

  const remove = (chip: ActiveChip) => {
    if (chip.value === undefined) {
      set({ [chip.key]: null });
      return;
    }
    const rest = params.getAll(chip.key).filter((v) => v !== chip.value);
    set({ [chip.key]: rest.length ? rest : null });
  };

  return (
    <div className="flex flex-wrap gap-2 px-7 pb-1 pt-3">
      <ClearFilters count={chips.length} />
      {chips.map((chip) => (
        <span
          key={`${chip.key}:${chip.value ?? ""}`}
          className="flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-[12.5px] text-accent-ink"
        >
          {chip.label}
          <button type="button" onClick={() => remove(chip)} aria-label={`Remove ${chip.label}`}>
            <X className="size-3.5 opacity-70 hover:opacity-100" />
          </button>
        </span>
      ))}
    </div>
  );
}
