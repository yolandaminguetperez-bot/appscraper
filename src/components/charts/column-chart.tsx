import { compactNumber } from "@/lib/format";

/**
 * Discrete buckets — one column per month — rather than an area line.
 *
 * Releases per month were drawn with the daily trend chart, which joins the
 * points into a continuous shape and labels the axis with days. Monthly counts
 * are not a continuous quantity: nothing happens "between" two months, and the
 * line implied a movement the data does not have.
 */
export function ColumnChart({
  title,
  subtitle,
  points,
  emphasizeLast = true,
}: {
  title: string;
  subtitle?: string;
  points: { day: string; value: number }[];
  emphasizeLast?: boolean;
}) {
  if (points.length === 0) return null;

  const peak = Math.max(...points.map((p) => p.value), 1);
  const total = points.reduce((sum, p) => sum + p.value, 0);

  // The final bucket is the month we are in, so it is incomplete by definition.
  // Comparing it against a full month reports a collapse that has not happened:
  // the delta is taken between the last two *closed* months, and the partial
  // column is drawn hatched so it is not read as a real drop.
  const today = new Date();
  const currentMonth = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`;
  const partialIndex = points.findIndex((point) => point.day.slice(0, 7) === currentMonth);
  const closed = partialIndex === -1 ? points : points.slice(0, partialIndex);
  const last = closed[closed.length - 1];
  const previous = closed[closed.length - 2];
  const delta =
    last && previous && previous.value > 0 ? (last.value - previous.value) / previous.value : null;

  const monthLabel = (day: string) =>
    new Date(day + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const fullLabel = (day: string) =>
    new Date(day + "T00:00:00Z").toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--raise-1)]">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {subtitle && <p className="pt-0.5 text-[12.5px] text-ink-muted">{subtitle}</p>}

      <div className="flex items-baseline gap-3 pt-3">
        <span className="metric text-[28px] font-semibold leading-none">{compactNumber(total)}</span>
        <span className="text-[12px] text-ink-muted">
          in {points.length} months
          {delta !== null && (
            <>
              {" · "}
              <span className={delta >= 0 ? "text-pos" : "text-neg"}>
                {delta >= 0 ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(0)}%
              </span>{" "}
              {last ? `in ${fullLabel(last.day)}` : "last month"}
            </>
          )}
        </span>
      </div>

      <div className="flex h-[150px] items-end gap-[3px] pt-4">
        {points.map((point, index) => {
          const isPartial = index === partialIndex;
          const isLastClosed = emphasizeLast && point === last;
          return (
            <div
              key={point.day}
              className="group relative flex h-full flex-1 flex-col justify-end"
              title={`${fullLabel(point.day)}: ${point.value}${isPartial ? " so far — month still running" : ""}`}
            >
              <span
                className={`w-full rounded-t-[4px] transition-colors ${
                  isPartial
                    ? "bg-[repeating-linear-gradient(135deg,var(--chart-line)_0_3px,transparent_3px_6px)] opacity-70"
                    : isLastClosed
                      ? "bg-chart-line"
                      : "bg-chart-line/35 group-hover:bg-chart-line/60"
                }`}
                style={{ height: `${Math.max(2, (point.value / peak) * 100)}%` }}
              />
            </div>
          );
        })}
      </div>

      {partialIndex !== -1 && (
        <p className="pt-2 text-[11px] text-ink-faint">
          The hatched column is the month in progress.
        </p>
      )}

      {/* Every third month keeps the axis readable at this width. */}
      <div className="flex gap-[3px] pt-1.5">
        {points.map((point, index) => (
          <span key={point.day} className="flex-1 text-center text-[10px] text-ink-faint">
            {index % 3 === 0 || index === points.length - 1 ? monthLabel(point.day) : ""}
          </span>
        ))}
      </div>
    </section>
  );
}
