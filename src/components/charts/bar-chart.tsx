"use client";

import { useState } from "react";
import { compactNumber, money } from "@/lib/format";

export type Bar = { label: string; value: number; note?: string };

/**
 * Formatting is named, not passed as a function: this is a client component, so
 * a function prop from a server component fails at request time.
 */
const FORMATTERS = {
  money: (value: number) => money(value),
  compact: (value: number) => compactNumber(value),
  plain: (value: number) => value.toLocaleString(),
} as const;

/**
 * Horizontal bars: category names are long, and horizontal keeps them readable
 * without rotation. Magnitude is one hue — these are amounts, not identities —
 * and each bar is directly labelled, so the reader never decodes colour.
 */
export function BarChart({
  bars,
  format = "plain",
  title,
  subtitle,
}: {
  bars: Bar[];
  format?: keyof typeof FORMATTERS;
  title: string;
  subtitle?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const formatValue = FORMATTERS[format];
  const max = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {subtitle && <p className="pt-0.5 text-[12.5px] text-ink-muted">{subtitle}</p>}

      <ul className="space-y-2.5 pt-4">
        {bars.map((bar) => (
          <li
            key={bar.label}
            onPointerEnter={() => setHover(bar.label)}
            onPointerLeave={() => setHover(null)}
            className="grid grid-cols-[minmax(0,120px)_1fr_auto] items-center gap-3"
          >
            <span className="truncate text-[12.5px] text-ink-muted">{bar.label}</span>
            <span className="relative block h-5">
              <span
                className="absolute inset-y-0 left-0 block rounded-r-[4px] bg-[var(--chart-fill)] transition-opacity"
                style={{
                  width: `${Math.max((bar.value / max) * 100, 1.5)}%`,
                  opacity: hover === null || hover === bar.label ? 1 : 0.45,
                }}
              />
            </span>
            <span className="text-right text-[12.5px] font-medium tabular-nums">
              {formatValue(bar.value)}
              {bar.note && <span className="pl-1.5 text-[11px] text-ink-faint">{bar.note}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
