"use client";

import { Search } from "lucide-react";
import { useFilterParams } from "@/components/filters/use-filter-params";
import { FilterPopover } from "@/components/filters/filter-popover";
import { CheckboxList, RadioList } from "@/components/filters/controls";
import { cn } from "@/lib/cn";

const RATINGS = [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} stars` }));
const SENTIMENTS = [
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
];
const WINDOWS = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
];

export function ReviewsFilterBar({ topics }: { topics: string[] }) {
  const { get, getAll, set } = useFilterParams();
  const ratings = getAll("rating");
  const sentiments = getAll("sentiment");
  const selectedTopics = getAll("topic");

  return (
    <div className="px-7 pt-5">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5">
        <Search className="size-4 shrink-0 text-ink-faint" />
        <input
          defaultValue={get("q") ?? ""}
          placeholder="Search review text or app…"
          onKeyDown={(e) => {
            if (e.key === "Enter") set({ q: (e.target as HTMLInputElement).value.trim() || null });
          }}
          onBlur={(e) => set({ q: e.target.value.trim() || null })}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <FilterPopover label="Rating" icon="reviews" badge={ratings.length} active={ratings.length > 0}>
          <CheckboxList options={RATINGS} selected={ratings} onChange={(v) => set({ rating: v })} />
        </FilterPopover>

        <FilterPopover
          label="Sentiment"
          icon="heart"
          badge={sentiments.length}
          active={sentiments.length > 0}
        >
          <CheckboxList
            options={SENTIMENTS}
            selected={sentiments}
            onChange={(v) => set({ sentiment: v })}
          />
        </FilterPopover>

        <FilterPopover label="Period" icon="trending" active={Boolean(get("window"))}>
          <RadioList options={WINDOWS} value={get("window")} onChange={(v) => set({ window: v })} />
        </FilterPopover>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="pr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          Topics
        </span>
        {topics.map((topic) => {
          const active = selectedTopics.includes(topic);
          return (
            <button
              key={topic}
              type="button"
              onClick={() =>
                set({ topic: active ? selectedTopics.filter((t) => t !== topic) : [...selectedTopics, topic] })
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] capitalize",
                active
                  ? "border-accent/40 bg-accent-soft text-accent-ink"
                  : "border-line bg-surface text-ink-muted hover:text-ink",
              )}
            >
              {topic}
            </button>
          );
        })}
      </div>
    </div>
  );
}
