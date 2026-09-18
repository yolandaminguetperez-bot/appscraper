/**
 * Turns Natural Earth's 110m country polygons into pre-projected SVG paths.
 *
 * The projection and simplification happen here, once, rather than in the app:
 * the browser gets path strings it can draw directly, and the repo carries a
 * file a fraction of the source's size.
 *
 * Equal Earth (Šavrič, Patterson & Jenny 2018) rather than Mercator: a
 * choropleth encodes magnitude by area, and Mercator inflates high latitudes
 * enough to make Greenland shout over India.
 *
 * Usage: node scripts/make-world-geo.mjs [source.geojson]
 */
import fs from "node:fs";
import path from "node:path";

const SOURCE =
  process.argv[2] ??
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const OUT = path.join(process.cwd(), "src", "lib", "geo", "world.json");

const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;

function equalEarth(lon, lat) {
  const l = (lon * Math.PI) / 180;
  const p = (lat * Math.PI) / 180;
  const theta = Math.asin(M * Math.sin(p));
  const t2 = theta * theta;
  const t6 = t2 * t2 * t2;
  const x = (l * Math.cos(theta)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [x, y];
}

/** Rings smaller than this in projected units are specks at map size. */
const MIN_AREA = 0.0015;

function ringArea(points) {
  let sum = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    sum += (points[j][0] - points[i][0]) * (points[j][1] + points[i][1]);
  }
  return Math.abs(sum / 2);
}

async function load() {
  if (SOURCE.startsWith("http")) {
    const res = await fetch(SOURCE);
    if (!res.ok) throw new Error(`source returned ${res.status}`);
    return res.json();
  }
  return JSON.parse(fs.readFileSync(SOURCE, "utf8"));
}

const geo = await load();

// Project everything first so the extent is known before scaling to a viewBox.
const projected = [];
let minX = Infinity;
let minY = Infinity;
let maxX = -Infinity;
let maxY = -Infinity;

for (const feature of geo.features) {
  const props = feature.properties ?? {};
  const code = (props.ISO_A2_EH ?? props.ISO_A2 ?? "").toLowerCase();
  const name = props.NAME ?? props.ADMIN ?? code;
  if (!code || code === "-99") continue;

  const polygons =
    feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;

  // Outer rings only: holes are invisible at this scale and double the bytes.
  const candidates = polygons
    .map((polygon) => polygon[0].map(([lon, lat]) => equalEarth(lon, lat)))
    .filter((points) => points.length >= 4)
    .map((points) => ({ points, area: ringArea(points) }))
    .sort((a, b) => b.area - a.area);

  // The largest ring is always kept, however small: dropping it deletes the
  // country from the map, and Belgium being tiny is not a reason to erase it.
  const rings = candidates
    .filter((ring, index) => index === 0 || ring.area >= MIN_AREA)
    .map((ring) => ring.points);

  for (const points of rings) {
    for (const [x, y] of points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (rings.length) projected.push({ code, name, rings });
}

const WIDTH = 1000;
const scale = WIDTH / (maxX - minX);
const HEIGHT = Math.round((maxY - minY) * scale);

const countries = projected
  .map(({ code, name, rings }) => ({
    code,
    name,
    d: rings
      .map((points) => {
        // Whole units in a 1000-wide box: the map draws ~700px across, so a
        // unit is under a pixel and a decimal place is invisible coastline
        // detail paid for on every page view. Points that collapse onto each
        // other after rounding are dropped rather than emitted twice.
        const out = [];
        let last = "";
        for (const [x, y] of points) {
          const px = Math.round((x - minX) * scale);
          const py = Math.round((maxY - y) * scale);
          const point = `${px},${py}`;
          if (point === last) continue;
          out.push(`${out.length === 0 ? "M" : "L"}${point}`);
          last = point;
        }
        return out.length >= 3 ? out.join("") + "Z" : "";
      })
      .filter(Boolean)
      .join(""),
  }))
  .filter((country) => country.d)
  .sort((a, b) => a.code.localeCompare(b.code));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ width: WIDTH, height: HEIGHT, countries }));

const bytes = fs.statSync(OUT).size;
console.log(`wrote ${countries.length} countries, ${WIDTH}x${HEIGHT}, ${(bytes / 1024).toFixed(0)}KB -> ${OUT}`);
