"use client";

import { Search } from "lucide-react";
import { useFilterParams } from "@/components/filters/use-filter-params";
import { FilterPopover } from "@/components/filters/filter-popover";
import { CheckboxList, NumberField, RadioList } from "@/components/filters/controls";
import { MoreFilters } from "@/components/filters/more-filters";
import { X } from "lucide-react";

const TIME_OPTIONS = [
  { value: "7", label: "Released last 7 days" },
  { value: "30", label: "Released last 30 days" },
  { value: "90", label: "Released last 90 days" },
  { value: "365", label: "Released last year" },
];

const STORE_OPTIONS = [
  { value: "ios", label: "App Store" },
  { value: "android", label: "Google Play" },
];

const SIGNAL_OPTIONS = [
  { value: "ads", label: "Running paid ads" },
  { value: "organic", label: "Has creator videos" },
  { value: "onboarding", label: "Onboarding captured" },
];

const IAP_OPTIONS = [
  { value: "1", label: "Has in-app purchases" },
  { value: "0", label: "No in-app purchases" },
];

const SORT_OPTIONS = [
  { value: "revenue", label: "Revenue" },
  { value: "downloads", label: "Downloads" },
  { value: "reviews", label: "Reviews" },
  { value: "rating", label: "Rating" },
  { value: "released", label: "Release date" },
  { value: "updated", label: "Last update" },
  { value: "title", label: "Title" },
];

const SEARCH_IN = [
  { value: "title", label: "Title" },
  { value: "developer", label: "Developer" },
  { value: "description", label: "Description" },
];

export function AppsFilterBar({
  categories,
  languages,
}: {
  categories: string[];
  languages: string[];
}) {
  const { get, getAll, set } = useFilterParams();

  const stores = getAll("store");
  const included = getAll("cat");
  const excluded = getAll("xcat");
  const langs = getAll("lang");
  const signals = getAll("signal");

  // Everything tucked away still declares itself in the badge.
  const secondaryCount =
    getAll("xcat").length +
    getAll("lang").length +
    signals.length +
    ["priceMin", "priceMax", "iap", "minRevenue", "minDownloads", "minReviews", "minRating"].filter(
      (key) => get(key),
    ).length;

  return (
    <div className="px-7 pt-5">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5">
        <Search className="size-4 shrink-0 text-ink-faint" />
        <input
          key={get("q") ?? ""}
          defaultValue={get("q") ?? ""}
          placeholder="Search apps, developers, descriptions…"
          onKeyDown={(e) => {
            if (e.key === "Enter") set({ q: (e.target as HTMLInputElement).value.trim() || null });
          }}
          onBlur={(e) => set({ q: e.target.value.trim() || null })}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
        {get("q") && (
          <button
            type="button"
            onClick={() => set({ q: null })}
            aria-label="Clear search"
            className="grid size-6 place-items-center rounded-full text-ink-faint hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        )}
        <select
          value={get("in") ?? "title"}
          onChange={(e) => set({ in: e.target.value === "title" ? null : e.target.value })}
          className="rounded-full bg-surface-muted px-3 py-1.5 text-[12.5px] outline-none"
        >
          {SEARCH_IN.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterPopover label="Time" icon="trending" active={Boolean(get("released"))}>
          <RadioList
            options={TIME_OPTIONS}
            value={get("released")}
            onChange={(v) => set({ released: v })}
          />
        </FilterPopover>

        <FilterPopover label="Store" icon="apps" badge={stores.length} active={stores.length > 0}>
          <CheckboxList options={STORE_OPTIONS} selected={stores} onChange={(v) => set({ store: v })} />
        </FilterPopover>

        <FilterPopover
          label={included.length ? `${included.length} included` : "Categories"}
          icon="onboardings"
          active={included.length > 0}
        >
          <CheckboxList
            options={categories.map((c) => ({ value: c, label: c }))}
            selected={included}
            onChange={(v) => set({ cat: v })}
          />
        </FilterPopover>

        <MoreFilters activeCount={secondaryCount}>
        <FilterPopover
            label={excluded.length ? `${excluded.length} excluded` : "Exclude"}
            icon="onboardings"
            active={excluded.length > 0}
          >
            <CheckboxList
              options={categories.map((c) => ({ value: c, label: c }))}
              selected={excluded}
              onChange={(v) => set({ xcat: v })}
            />
          </FilterPopover>

          <FilterPopover label="Language" icon="globe" badge={langs.length} active={langs.length > 0}>
            <CheckboxList
              options={languages.map((l) => ({ value: l, label: l.toUpperCase() }))}
              selected={langs}
              onChange={(v) => set({ lang: v })}
            />
          </FilterPopover>

          <FilterPopover
            label="Price"
            icon="reviews"
            active={Boolean(get("priceMin") || get("priceMax"))}
          >
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Min $" value={get("priceMin") ?? ""} onCommit={(v) => set({ priceMin: v })} />
              <NumberField label="Max $" value={get("priceMax") ?? ""} onCommit={(v) => set({ priceMax: v })} />
            </div>
          </FilterPopover>

          <FilterPopover label="In-app purchases" icon="reviews" active={Boolean(get("iap"))}>
            <RadioList options={IAP_OPTIONS} value={get("iap")} onChange={(v) => set({ iap: v })} />
          </FilterPopover>

          <FilterPopover label="Min revenue" icon="trending" active={Boolean(get("minRevenue"))}>
            <NumberField
              label="Lifetime revenue at least ($)"
              value={get("minRevenue") ?? ""}
              placeholder="100000"
              onCommit={(v) => set({ minRevenue: v })}
            />
          </FilterPopover>

          <FilterPopover label="Min downloads" icon="trending" active={Boolean(get("minDownloads"))}>
            <NumberField
              label="Downloads at least"
              value={get("minDownloads") ?? ""}
              placeholder="50000"
              onCommit={(v) => set({ minDownloads: v })}
            />
          </FilterPopover>

          <FilterPopover label="Min reviews" icon="reviews" active={Boolean(get("minReviews"))}>
            <NumberField
              label="Reviews at least"
              value={get("minReviews") ?? ""}
              placeholder="1000"
              onCommit={(v) => set({ minReviews: v })}
            />
          </FilterPopover>

          <FilterPopover label="Min rating" icon="reviews" active={Boolean(get("minRating"))}>
            <NumberField
              label="Rating at least"
              value={get("minRating") ?? ""}
              placeholder="4.0"
              onCommit={(v) => set({ minRating: v })}
            />
          </FilterPopover>

          <FilterPopover
            label="Marketing signals"
            icon="ads"
            badge={signals.length}
            active={signals.length > 0}
          >
            <CheckboxList options={SIGNAL_OPTIONS} selected={signals} onChange={(v) => set({ signal: v })} />
          </FilterPopover>

        </MoreFilters>

        <FilterPopover label="Sort" icon="trending" active={Boolean(get("sort"))}>
          <RadioList options={SORT_OPTIONS} value={get("sort") ?? "revenue"} onChange={(v) => set({ sort: v })} />
          <button
            type="button"
            onClick={() => set({ dir: get("dir") === "asc" ? null : "asc" })}
            className="mt-2 w-full rounded-lg border border-line px-2 py-1.5 text-[12.5px] text-ink-muted hover:text-ink"
          >
            {get("dir") === "asc" ? "Ascending ↑" : "Descending ↓"}
          </button>
        </FilterPopover>
      </div>
    </div>
  );
}
