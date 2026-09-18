"use client";

import { Search } from "lucide-react";
import { useFilterParams } from "@/components/filters/use-filter-params";
import { FilterPopover } from "@/components/filters/filter-popover";
import { CheckboxList, NumberField, RadioList } from "@/components/filters/controls";
import { cn } from "@/lib/cn";

const KINDS = [
  { value: "", label: "All" },
  { value: "onboarding", label: "Onboardings" },
  { value: "web-funnel", label: "Web funnels" },
];

const SORTS = [
  { value: "revenue", label: "Highest revenue" },
  { value: "downloads", label: "Most downloads" },
  { value: "screens", label: "Longest flow" },
  { value: "recent", label: "Most recent" },
];

export function FlowsFilterBar({
  screenTypes,
  categories,
  languages,
}: {
  screenTypes: string[];
  categories: string[];
  languages: string[];
}) {
  const { get, getAll, set } = useFilterParams();
  const kind = get("kind") ?? "";
  const selectedScreens = getAll("screen");
  const cats = getAll("cat");
  const langs = getAll("lang");

  return (
    <div className="px-7 pt-5">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5">
        <Search className="size-4 shrink-0 text-ink-faint" />
        <input
          defaultValue={get("q") ?? ""}
          placeholder="Search apps…"
          onKeyDown={(e) => {
            if (e.key === "Enter") set({ q: (e.target as HTMLInputElement).value.trim() || null });
          }}
          onBlur={(e) => set({ q: e.target.value.trim() || null })}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <FilterPopover label="App category" icon="onboardings" badge={cats.length} active={cats.length > 0}>
          <CheckboxList
            options={categories.map((c) => ({ value: c, label: c }))}
            selected={cats}
            onChange={(v) => set({ cat: v })}
          />
        </FilterPopover>

        <FilterPopover label="App language" icon="globe" badge={langs.length} active={langs.length > 0}>
          <CheckboxList
            options={languages.map((l) => ({ value: l, label: l.toUpperCase() }))}
            selected={langs}
            onChange={(v) => set({ lang: v })}
          />
        </FilterPopover>

        <FilterPopover
          label="App size"
          icon="trending"
          active={Boolean(get("minDownloads") || get("minMrr"))}
        >
          <div className="space-y-2">
            <NumberField
              label="App downloads at least"
              value={get("minDownloads") ?? ""}
              onCommit={(v) => set({ minDownloads: v })}
            />
            <NumberField
              label="App MRR at least ($)"
              value={get("minMrr") ?? ""}
              onCommit={(v) => set({ minMrr: v })}
            />
          </div>
        </FilterPopover>

        <FilterPopover label="Sort" icon="trending" active={Boolean(get("sort"))}>
          <RadioList options={SORTS} value={get("sort") ?? "revenue"} onChange={(v) => set({ sort: v })} />
        </FilterPopover>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {KINDS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => set({ kind: option.value || null })}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[12.5px]",
              kind === option.value
                ? "border-accent/40 bg-accent-soft text-accent-ink"
                : "border-line bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
        <span className="pr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          Screens
        </span>
        {screenTypes.map((type) => {
          const active = selectedScreens.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() =>
                set({
                  screen: active
                    ? selectedScreens.filter((s) => s !== type)
                    : [...selectedScreens, type],
                })
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px]",
                active
                  ? "border-accent/40 bg-accent-soft text-accent-ink"
                  : "border-line bg-surface text-ink-muted hover:text-ink",
              )}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}
