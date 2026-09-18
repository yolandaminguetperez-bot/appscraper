"use client";

import { Bell, BellRing } from "lucide-react";
import { useState, useTransition } from "react";
import { createAlertAction } from "@/app/actions/alerts";
import type { AlertMetric } from "@/lib/db/alerts-query";
import { cn } from "@/lib/cn";

const METRICS: { value: AlertMetric; label: string; unit: string; suggested: number }[] = [
  { value: "downloads", label: "Downloads", unit: "%", suggested: 20 },
  { value: "revenue", label: "Revenue", unit: "%", suggested: 20 },
  { value: "reviews", label: "Reviews", unit: "%", suggested: 15 },
  { value: "rating", label: "Rating", unit: "pts", suggested: 0.2 },
];

/**
 * Sets a rule from the place you noticed you wanted one.
 *
 * The threshold is pre-filled per metric rather than left at zero: a rule that
 * fires on any movement at all fires constantly and gets ignored, which is
 * worse than no rule.
 */
export function AlertButton({ appId, title }: { appId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [metric, setMetric] = useState<AlertMetric>("downloads");
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [threshold, setThreshold] = useState(20);
  const [pending, start] = useTransition();

  const chosen = METRICS.find((entry) => entry.value === metric)!;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
          saved ? "border-accent/40 bg-accent-soft text-accent-ink" : "border-line text-ink-muted hover:text-ink",
        )}
      >
        {saved ? <BellRing className="size-3.5" /> : <Bell className="size-3.5" />}
        {saved ? "Alert set" : "Alert me"}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-line bg-surface p-4 shadow-[var(--raise-2)]">
          <p className="text-[13px] font-medium">Alert me when {title}</p>

          <div className="flex gap-2 pt-3">
            <select
              value={direction}
              onChange={(event) => setDirection(event.target.value as "up" | "down")}
              aria-label="Direction"
              className="flex-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-[12.5px]"
            >
              <option value="up">gains</option>
              <option value="down">loses</option>
            </select>
            <input
              type="number"
              value={threshold}
              step={metric === "rating" ? 0.1 : 5}
              min={0}
              onChange={(event) => setThreshold(Number(event.target.value))}
              aria-label="Threshold"
              className="w-20 rounded-lg border border-line bg-surface px-2 py-1.5 text-[12.5px]"
            />
            <span className="self-center text-[12px] text-ink-muted">{chosen.unit}</span>
          </div>

          <select
            value={metric}
            onChange={(event) => {
              const next = event.target.value as AlertMetric;
              setMetric(next);
              setThreshold(METRICS.find((entry) => entry.value === next)!.suggested);
            }}
            aria-label="Metric"
            className="mt-2 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-[12.5px]"
          >
            {METRICS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                in {entry.label.toLowerCase()}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await createAlertAction({ appId, metric, direction, threshold });
                setSaved(true);
                setOpen(false);
              })
            }
            className="mt-3 w-full rounded-full bg-accent px-3 py-2 text-[12.5px] font-medium text-panel transition-colors hover:bg-accent-ink hover:text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Create alert"}
          </button>
          <p className="pt-2 text-[11px] text-ink-faint">
            Checked over the last 7 days, every time you open the dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
