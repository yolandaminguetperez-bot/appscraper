"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type Series = { id: string; label: string; values: number[] };

const PLOT = { width: 720, height: 220 };
const PAD = { left: 62, right: 96, top: 14, bottom: 28 };
const SERIES_VARS = ["--series-1", "--series-2", "--series-3", "--series-4"];

function money(value: number): string {
  if (value === 0) return "$0";
  return `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

function exact(value: number): string {
  return `$${new Intl.NumberFormat("en-US").format(Math.round(value))}`;
}

function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step * 0.001; value += step) ticks.push(value);
  return ticks;
}

/**
 * Several apps on one scale. Colour is assigned in fixed token order and never
 * cycled; a legend is always present and each line is also labelled at its end,
 * so identity never rests on hue alone.
 */
export function MultiTrendChart({
  series,
  title,
  subtitle,
}: {
  series: Series[];
  title: string;
  subtitle?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const length = Math.max(...series.map((s) => s.values.length), 0);

  const { ticks, x, y } = useMemo(() => {
    const peak = Math.max(...series.flatMap((s) => s.values), 0);
    const ticks = niceTicks(peak);
    const max = Math.max(ticks[ticks.length - 1], 1);
    return {
      ticks,
      x: (index: number) => (length <= 1 ? 0 : (index / (length - 1)) * PLOT.width),
      y: (value: number) => PLOT.height - (value / max) * PLOT.height,
    };
  }, [series, length]);

  if (series.length === 0 || length < 2) {
    return (
      <section className="surface-card p-5">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <p className="pt-2 text-[13px] text-ink-muted">Pick at least one app to plot.</p>
      </section>
    );
  }

  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const plotX = ratio * (PLOT.width + PAD.left + PAD.right) - PAD.left;
    const index = Math.round((plotX / PLOT.width) * (length - 1));
    setHover(Math.max(0, Math.min(length - 1, index)));
  };

  return (
    <section className="surface-card p-5">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {subtitle && <p className="pt-0.5 text-[12.5px] text-ink-muted">{subtitle}</p>}

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 pt-3">
        {series.map((s, index) => (
          <li key={s.id} className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ background: `var(${SERIES_VARS[index % SERIES_VARS.length]})` }}
            />
            {s.label}
          </li>
        ))}
      </ul>

      <div className="relative mt-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${PLOT.width + PAD.left + PAD.right} ${PLOT.height + PAD.top + PAD.bottom}`}
          className="w-full"
          role="img"
          aria-label={`${title}: ${series.map((s) => s.label).join(", ")}`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={0}
                  x2={PLOT.width}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--chart-grid)"
                  strokeWidth={1}
                />
                <text
                  x={-10}
                  y={y(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-[var(--ink-faint)] text-[11px] tabular-nums"
                >
                  {money(tick)}
                </text>
              </g>
            ))}

            {series.map((s, index) => {
              const colour = `var(${SERIES_VARS[index % SERIES_VARS.length]})`;
              const path = s.values
                .map((value, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(value).toFixed(2)}`)
                .join(" ");
              const lastIndex = s.values.length - 1;

              return (
                <g key={s.id}>
                  <path
                    d={path}
                    fill="none"
                    stroke={colour}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <circle
                    cx={x(lastIndex)}
                    cy={y(s.values[lastIndex])}
                    r={4}
                    fill={colour}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                  <text
                    x={x(lastIndex) + 10}
                    y={y(s.values[lastIndex])}
                    dy="0.32em"
                    className="fill-[var(--ink)] text-[11px] font-medium tabular-nums"
                  >
                    {money(s.values[lastIndex])}
                  </text>
                </g>
              );
            })}

            {hover !== null && (
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={0}
                y2={PLOT.height}
                stroke="var(--ink-faint)"
                strokeWidth={1}
              />
            )}
          </g>
        </svg>

        {hover !== null && (
          <div
            role="status"
            className={cn(
              "pointer-events-none absolute top-0 min-w-[150px] rounded-xl border border-line bg-surface px-3 py-2",
              "shadow-[0_12px_28px_-16px_rgba(16,21,17,0.45)]",
            )}
            style={{
              left: `${((PAD.left + x(hover)) / (PLOT.width + PAD.left + PAD.right)) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="pb-1 text-[11px] text-ink-muted">Day {hover + 1}</p>
            <ul className="space-y-0.5">
              {series.map((s, index) => (
                <li key={s.id} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <span
                      className="inline-block h-0.5 w-3 rounded-full"
                      style={{ background: `var(${SERIES_VARS[index % SERIES_VARS.length]})` }}
                    />
                    {s.label}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {exact(s.values[hover] ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
