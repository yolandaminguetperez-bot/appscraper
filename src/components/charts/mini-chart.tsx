/**
 * Row-sized trend. No axes — at this size they would be unreadable — so the
 * row's numeric columns carry magnitude and this carries shape.
 *
 * Unlike the full chart, the scale spans the series' own min..max rather than
 * starting at zero: values that sit in a narrow band high above zero flatten
 * into a straight line otherwise, which is exactly the shape a reader cannot use.
 */
/** Points beyond this add bytes to every row without adding readable detail. */
const MAX_POINTS = 24;

function downsample(values: number[]): number[] {
  if (values.length <= MAX_POINTS) return values;
  const step = (values.length - 1) / (MAX_POINTS - 1);
  return Array.from({ length: MAX_POINTS }, (_, i) => values[Math.round(i * step)]);
}

export function MiniChart({
  values,
  label,
  className = "h-8 w-24",
}: {
  values: number[];
  label: string;
  className?: string;
}) {
  if (values.length < 2) {
    return <span className={`${className} block`} aria-hidden />;
  }

  const points = downsample(values);
  const width = 100;
  const height = 32;
  const pad = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  // One decimal: at 24px tall the second one is sub-pixel, and it is paid for on
  // every row of every page.
  const coords = points.map((value, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = pad + (1 - (value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const rising = points[points.length - 1] >= points[0];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={className}
    >
      <path d={area} fill="var(--chart-fill)" opacity={rising ? 0.13 : 0.07} />
      <path
        d={line}
        fill="none"
        stroke={rising ? "var(--chart-line)" : "var(--ink-faint)"}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={coords[coords.length - 1][0]}
        cy={coords[coords.length - 1][1]}
        r={2.5}
        fill={rising ? "var(--chart-line)" : "var(--ink-faint)"}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
