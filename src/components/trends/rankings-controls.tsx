"use client";

import { Apple, Play } from "lucide-react";
import { useFilterParams } from "@/components/filters/use-filter-params";
import { cn } from "@/lib/cn";

const CHARTS = [
  { value: "free", label: "Top Free" },
  { value: "paid", label: "Top Paid" },
  { value: "grossing", label: "Top Grossing" },
];

export function RankingsControls({ countries }: { countries: string[] }) {
  const { get, set } = useFilterParams();
  const chart = get("chart") ?? "free";
  const store = get("store") ?? "ios";
  const country = get("country") ?? "us";

  return (
    <div className="flex flex-wrap items-center gap-3 px-7 pt-5">
      <div className="flex items-center rounded-full border border-line bg-surface p-1">
        {CHARTS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => set({ chart: option.value === "free" ? null : option.value })}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px]",
              chart === option.value ? "bg-accent-soft text-accent-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center rounded-full border border-line bg-surface p-1">
        {[
          { value: "ios", label: "App Store", Icon: Apple },
          { value: "android", label: "Google Play", Icon: Play },
        ].map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => set({ store: value === "ios" ? null : value })}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px]",
              store === value ? "bg-accent-soft text-accent-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      <select
        value={country}
        onChange={(e) => set({ country: e.target.value === "us" ? null : e.target.value })}
        className="rounded-full border border-line bg-surface px-4 py-2 text-[13px] outline-none"
      >
        {countries.map((code) => (
          <option key={code} value={code}>
            {code.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
