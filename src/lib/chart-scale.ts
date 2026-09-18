export type Point = { day: string; value: number };

/** Axis ticks land on 1/2/5 × 10ⁿ so the reader gets round numbers, not 137,428. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;

  const ticks: number[] = [];
  for (let value = 0; value <= max + step * 0.001; value += step) ticks.push(value);
  return ticks;
}

export function buildScale(points: Point[], width: number, height: number) {
  const values = points.map((p) => p.value);
  const rawMax = Math.max(...values, 0);
  const ticks = niceTicks(rawMax);
  const max = Math.max(ticks[ticks.length - 1], 1);

  const x = (index: number) =>
    points.length <= 1 ? 0 : (index / (points.length - 1)) * width;
  const y = (value: number) => height - (value / max) * height;

  return { x, y, max, ticks };
}

export function areaPath(points: Point[], width: number, height: number): string {
  const { x, y } = buildScale(points, width, height);
  if (points.length === 0) return "";
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(p.value).toFixed(2)}`);
  return `${line.join(" ")} L${width},${height} L0,${height} Z`;
}

export function linePath(points: Point[], width: number, height: number): string {
  const { x, y } = buildScale(points, width, height);
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(p.value).toFixed(2)}`)
    .join(" ");
}
