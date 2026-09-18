"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useFilterParams } from "@/components/filters/use-filter-params";
import { FilterPopover } from "@/components/filters/filter-popover";
import { CheckboxList, NumberField, RadioList } from "@/components/filters/controls";
import { cn } from "@/lib/cn";

const SORTS = [
  { value: "ads", label: "Most creatives" },
  { value: "revenue", label: "Highest MRR" },
  { value: "downloads", label: "Most downloads" },
  { value: "recent", label: "Most recently seen" },
];

export function AdsFilterBar({
  categories,
  languages,
  view,
}: {
  categories: string[];
  languages: string[];
  view: "grouped" | "ads";
}) {
  const { get, getAll, set, params } = useFilterParams();

  const viewHref = (next: "grouped" | "ads") => {
    const search = new URLSearchParams(params.toString());
    search.set("view", next);
    search.delete("page");
    return `/dashboard/ads?${search.toString()}`;
  };
  const cats = getAll("cat");
  const langs = getAll("lang");

  return (
    <div className="px-7 pt-5">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5">
        <Search className="size-4 shrink-0 text-ink-faint" />
        <input
          defaultValue={get("q") ?? ""}
          placeholder="Search apps or advertisers…"
          onKeyDown={(e) => {
            if (e.key === "Enter") set({ q: (e.target as HTMLInputElement).value.trim() || null });
          }}
          onBlur={(e) => set({ q: e.target.value.trim() || null })}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
        <div className="flex items-center gap-1 rounded-full bg-surface-muted p-1">
          {(["grouped", "ads"] as const).map((v) => (
            <Link
              key={v}
              href={viewHref(v)}
              className={cn(
                "rounded-full px-3 py-1 text-[12.5px] capitalize",
                view === v ? "bg-accent-soft text-accent-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {v === "grouped" ? "By app" : "All ads"}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <FilterPopover label="Category" icon="onboardings" badge={cats.length} active={cats.length > 0}>
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

        <FilterPopover label="MRR" icon="trending" active={Boolean(get("minMrr"))}>
          <NumberField
            label="App MRR at least ($)"
            value={get("minMrr") ?? ""}
            placeholder="10000"
            onCommit={(v) => set({ minMrr: v })}
          />
        </FilterPopover>

        <FilterPopover label="Downloads" icon="trending" active={Boolean(get("minDownloads"))}>
          <NumberField
            label="App downloads at least"
            value={get("minDownloads") ?? ""}
            placeholder="100000"
            onCommit={(v) => set({ minDownloads: v })}
          />
        </FilterPopover>

        <FilterPopover
          label="Ad activity"
          icon="ads"
          active={Boolean(get("minAds") || get("minDays"))}
        >
          <div className="space-y-2">
            <NumberField
              label="Creatives at least"
              value={get("minAds") ?? ""}
              placeholder="3"
              onCommit={(v) => set({ minAds: v })}
            />
            <NumberField
              label="Running at least (days)"
              value={get("minDays") ?? ""}
              placeholder="30"
              onCommit={(v) => set({ minDays: v })}
            />
          </div>
        </FilterPopover>

        <FilterPopover label="Sort" icon="trending" active={Boolean(get("sort"))}>
          <RadioList options={SORTS} value={get("sort") ?? "ads"} onChange={(v) => set({ sort: v })} />
        </FilterPopover>
      </div>
    </div>
  );
}
