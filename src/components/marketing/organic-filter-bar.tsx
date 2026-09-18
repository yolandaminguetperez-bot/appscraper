"use client";

import { Search } from "lucide-react";
import { useFilterParams } from "@/components/filters/use-filter-params";
import { FilterPopover } from "@/components/filters/filter-popover";
import { CheckboxList, NumberField, RadioList } from "@/components/filters/controls";

const SORTS = [
  { value: "views", label: "Most views" },
  { value: "likes", label: "Most likes" },
  { value: "followers", label: "Biggest creators" },
  { value: "recent", label: "Most recent" },
];

export function OrganicFilterBar({
  platforms,
  categories,
}: {
  platforms: string[];
  categories: string[];
}) {
  const { get, getAll, set } = useFilterParams();
  const selectedPlatforms = getAll("platform");
  const cats = getAll("cat");

  return (
    <div className="px-7 pt-5">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5">
        <Search className="size-4 shrink-0 text-ink-faint" />
        <input
          defaultValue={get("q") ?? ""}
          placeholder="Search apps, creators or captions…"
          onKeyDown={(e) => {
            if (e.key === "Enter") set({ q: (e.target as HTMLInputElement).value.trim() || null });
          }}
          onBlur={(e) => set({ q: e.target.value.trim() || null })}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <FilterPopover
          label="Platform"
          icon="organic"
          badge={selectedPlatforms.length}
          active={selectedPlatforms.length > 0}
        >
          <CheckboxList
            options={platforms.map((p) => ({ value: p, label: p }))}
            selected={selectedPlatforms}
            onChange={(v) => set({ platform: v })}
          />
        </FilterPopover>

        <FilterPopover label="App category" icon="onboardings" badge={cats.length} active={cats.length > 0}>
          <CheckboxList
            options={categories.map((c) => ({ value: c, label: c }))}
            selected={cats}
            onChange={(v) => set({ cat: v })}
          />
        </FilterPopover>

        <FilterPopover label="Views" icon="organic" active={Boolean(get("minViews"))}>
          <NumberField
            label="Views at least"
            value={get("minViews") ?? ""}
            placeholder="100000"
            onCommit={(v) => set({ minViews: v })}
          />
        </FilterPopover>

        <FilterPopover label="Likes" icon="heart" active={Boolean(get("minLikes"))}>
          <NumberField
            label="Likes at least"
            value={get("minLikes") ?? ""}
            placeholder="5000"
            onCommit={(v) => set({ minLikes: v })}
          />
        </FilterPopover>

        <FilterPopover label="Followers" icon="heart" active={Boolean(get("minFollowers"))}>
          <NumberField
            label="Creator followers at least"
            value={get("minFollowers") ?? ""}
            placeholder="10000"
            onCommit={(v) => set({ minFollowers: v })}
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
          <RadioList options={SORTS} value={get("sort") ?? "views"} onChange={(v) => set({ sort: v })} />
        </FilterPopover>
      </div>
    </div>
  );
}
