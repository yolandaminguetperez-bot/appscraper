/**
 * Row-sized trend. No axes — at this size they would be unreadable — so the
 * row's numeric columns carry magnitude and this carries shape.
 *
 * Unlike the full chart, the scale spans the series' own min..max rather than
 * starting at zero: values that sit in a narrow band high above zero flatten
 * into a straight line otherwise, which is exactly the shape a reader cannot use.
 */
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

  const width = 100;
  const height = 32;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = pad + (1 - (value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const rising = values[values.length - 1] >= values[0];

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
