/** Minimal trend line: no axes, no grid — it exists to show shape, not values. */
export function Sparkline({
  points,
  label,
  className,
}: {
  points: number[];
  label: string;
  className?: string;
}) {
  const clean = points.filter((p) => Number.isFinite(p));
  if (clean.length < 2) {
    return <p className="text-[13px] text-ink-faint">Not enough history yet.</p>;
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;
  const width = 100;
  const height = 28;

  const coords = clean.map((value, index) => {
    const x = (index / (clean.length - 1)) * width;
    const y = height - ((value - min) / span) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={className}
    >
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
