"use client";

import { useMemo, useRef, useState } from "react";
import { Table2 } from "lucide-react";
import { buildScale, areaPath, linePath, type Point } from "@/lib/chart-scale";
import { cn } from "@/lib/cn";

type Format = "money" | "count" | "rating";

const PLOT = { width: 720, height: 200 };
// The right gutter has to hold the end label ("$157.7K" is 7 glyphs at 11.5px);
// at 60 it clipped against the card edge.
const PAD = { left: 58, right: 92, top: 12, bottom: 26 };

function formatValue(value: number, format: Format): string {
  if (format === "rating") return value.toFixed(1);
  if (format === "money") {
    if (value === 0) return "$0";
    return `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
  }
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatExact(value: number, format: Format): string {
  if (format === "rating") return value.toFixed(2);
  const n = new Intl.NumberFormat("en-US").format(Math.round(value));
  return format === "money" ? `$${n}` : n;
}

function formatDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? day
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * Single-series trend. One series means no legend — the title says what is
 * plotted — so identity comes from the axis labels, the end label and the
 * tooltip, never from the colour alone.
 */
export function TrendChart({
  points,
  title,
  format = "count",
  subtitle,
  aggregate = "sum",
  scaleMax,
}: {
  points: Point[];
  title: string;
  format?: Format;
  subtitle?: string;
  /** Headline figure: a total for flow metrics, a mean for level metrics like rating. */
  aggregate?: "sum" | "average";
  /** Fixes the y-axis top, for bounded scales such as a 1–5 rating. */
  scaleMax?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const { scale, area, line } = useMemo(() => {
    const scale = buildScale(points, PLOT.width, PLOT.height, scaleMax);
    return {
      scale,
      area: areaPath(points, PLOT.width, PLOT.height, scaleMax),
      line: linePath(points, PLOT.width, PLOT.height, scaleMax),
    };
  }, [points, scaleMax]);

  if (points.length < 2) {
    return (
      <section className="surface-card p-5">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <p className="pt-2 text-[13px] text-ink-muted">Not enough history yet to plot a trend.</p>
      </section>
    );
  }

  const mean = (list: Point[]) =>
    list.length === 0 ? 0 : list.reduce((sum, p) => sum + p.value, 0) / list.length;

  const latest = points[points.length - 1];
  const half = Math.floor(points.length / 2);
  const headline =
    aggregate === "average" ? mean(points) : points.reduce((sum, p) => sum + p.value, 0);
  const recent =
    aggregate === "average"
      ? mean(points.slice(half))
      : points.slice(half).reduce((s, p) => s + p.value, 0);
  const prior =
    aggregate === "average"
      ? mean(points.slice(0, half))
      : points.slice(0, half).reduce((s, p) => s + p.value, 0);
  const delta = prior > 0 ? (recent - prior) / prior : null;

  const active = hover === null ? null : points[hover];

  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const plotX = ratio * (PLOT.width + PAD.left + PAD.right) - PAD.left;
    // Snap to the nearest day: readers aim at a date, not at a hairline.
    const index = Math.round((plotX / PLOT.width) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, index)));
  };

  return (
    <section className="surface-card p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">{title}</h3>
          {subtitle && <p className="pt-0.5 text-[12.5px] text-ink-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] text-ink-muted hover:text-ink"
        >
          <Table2 className="size-3.5" />
          {showTable ? "Chart" : "Table"}
        </button>
      </header>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-3">
        {/* Proportional figures: tabular-nums loosens a headline number. */}
        <p className="text-[32px] font-semibold leading-none">{formatExact(headline, format)}</p>
        {delta !== null && (
          <p
            className={cn(
              "text-[13px] font-medium",
              delta >= 0 ? "text-accent-ink" : "text-[#a33131]",
            )}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(1)}% vs previous period
          </p>
        )}
      </div>

      {showTable ? (
        <div className="scroll-thin mt-4 max-h-[240px] overflow-y-auto rounded-xl border border-line">
          <table className="w-full text-[12.5px]">
            <caption className="sr-only">{title}, day by day</caption>
            <thead className="sticky top-0 bg-surface-muted text-left text-ink-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Day</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((point) => (
                <tr key={point.day} className="border-t border-line">
                  <td className="px-3 py-1.5">{formatDay(point.day)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatExact(point.value, format)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-4">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${PLOT.width + PAD.left + PAD.right} ${PLOT.height + PAD.top + PAD.bottom}`}
            className="w-full"
            role="img"
            aria-label={`${title}. ${formatExact(headline, format)} ${aggregate === "average" ? "on average" : "in total"} across ${points.length} points.`}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          >
            <g transform={`translate(${PAD.left},${PAD.top})`}>
              {scale.ticks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={0}
                    x2={PLOT.width}
                    y1={scale.y(tick)}
                    y2={scale.y(tick)}
                    stroke="var(--chart-grid)"
                    strokeWidth={1}
                  />
                  <text
                    x={-10}
                    y={scale.y(tick)}
                    dy="0.32em"
                    textAnchor="end"
                    className="fill-[var(--ink-faint)] text-[11px] tabular-nums"
                  >
                    {formatValue(tick, format)}
                  </text>
                </g>
              ))}

              <path d={area} fill="var(--chart-fill)" opacity={0.1} />
              <path
                d={line}
                fill="none"
                stroke="var(--chart-line)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* End marker carries a surface ring so it stays legible on the line. */}
              <circle
                cx={scale.x(points.length - 1)}
                cy={scale.y(latest.value)}
                r={4}
                fill="var(--chart-line)"
                stroke="var(--surface)"
                strokeWidth={2}
              />
              <text
                x={scale.x(points.length - 1) + 10}
                y={scale.y(latest.value)}
                dy="0.32em"
                className="fill-[var(--ink)] text-[11.5px] font-medium tabular-nums"
              >
                {formatValue(latest.value, format)}
              </text>

              {[0, Math.floor((points.length - 1) / 2), points.length - 1].map((index) => (
                <text
                  key={index}
                  x={scale.x(index)}
                  y={PLOT.height + 18}
                  textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
                  className="fill-[var(--ink-faint)] text-[11px]"
                >
                  {formatDay(points[index].day)}
                </text>
              ))}

              {active && hover !== null && (
                <g>
                  <line
                    x1={scale.x(hover)}
                    x2={scale.x(hover)}
                    y1={0}
                    y2={PLOT.height}
                    stroke="var(--ink-faint)"
                    strokeWidth={1}
                  />
                  <circle
                    cx={scale.x(hover)}
                    cy={scale.y(active.value)}
                    r={4}
                    fill="var(--chart-line)"
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                </g>
              )}
            </g>
          </svg>

          {active && hover !== null && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 rounded-xl border border-line bg-surface px-3 py-2 shadow-[0_12px_28px_-16px_rgba(16,21,17,0.45)]"
              style={{
                left: `${((PAD.left + scale.x(hover)) / (PLOT.width + PAD.left + PAD.right)) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              <p className="text-[13.5px] font-semibold tabular-nums">
                {formatExact(active.value, format)}
              </p>
              <p className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
                <span className="inline-block h-0.5 w-3 bg-[var(--chart-line)]" />
                {formatDay(active.day)}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
