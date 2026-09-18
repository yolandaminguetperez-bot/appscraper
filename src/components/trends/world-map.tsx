import Link from "next/link";
import world from "@/lib/geo/world.json";
import type { CountrySummary } from "@/lib/db/trends-query";

/**
 * Choropleth of chart overlap, on Equal Earth.
 *
 * Magnitude, so one hue light-to-dark rather than a spread of hues. Geometry is
 * projected and simplified at build time (scripts/make-world-geo.mjs), so this
 * renders on the server with no map library and no client JavaScript: hovering
 * a country uses the SVG's own <title>, and clicking one is an ordinary link.
 *
 * The country being viewed is drawn as a marked outline rather than the top
 * bucket. It overlaps itself completely by definition, so leaving it in the
 * scale would push every other country into the bottom step.
 */
const STEPS = ["var(--map-1)", "var(--map-2)", "var(--map-3)", "var(--map-4)"] as const;

function bucketOf(value: number, min: number, max: number): number {
  if (max <= min) return STEPS.length - 1;
  const share = (value - min) / (max - min);
  return Math.min(STEPS.length - 1, Math.floor(share * STEPS.length));
}

export function WorldMap({
  countries,
  current,
  hrefFor,
}: {
  countries: CountrySummary[];
  current: string;
  hrefFor: string;
}) {
  const others = countries.filter((row) => row.country !== current);
  if (others.length === 0) return null;

  const values = others.map((row) => row.sharedWithCurrent);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const byCode = new Map(countries.map((row) => [row.country, row]));

  const label = (row: CountrySummary) =>
    `${row.country.toUpperCase()} — ${row.sharedWithCurrent} of ${row.apps} apps also chart in ${current.toUpperCase()}`;

  return (
    <section className="surface-card p-5">
      <h2 className="text-[15px] font-semibold">Where this chart looks like {current.toUpperCase()}</h2>
      <p className="pt-0.5 text-[12.5px] text-ink-muted">
        Darker means more of that country&apos;s top 50 also charts in {current.toUpperCase()}. Countries
        we hold no chart data for are left unshaded.
      </p>

      {/* The unshaded base is an image: 175 country paths inlined here would be
          serialised into the HTML and again into the RSC payload, ~156KB per
          view, for geometry that never changes. Only the countries with data
          stay inline, where they can be hovered and clicked. */}
      <div className="relative mt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/api/world-map" alt="" width={world.width} height={world.height} className="w-full" />
        <svg
          viewBox={`0 0 ${world.width} ${world.height}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`Chart overlap with ${current.toUpperCase()}, by country`}
        >
          {world.countries
            .filter((country) => byCode.has(country.code))
            .map((country) => {
              const row = byCode.get(country.code)!;
              const isCurrent = country.code === current;

              return (
                <Link key={country.code} href={`${hrefFor}${country.code}`}>
                  <path
                    d={country.d}
                    fill={isCurrent ? "var(--accent-soft)" : STEPS[bucketOf(row.sharedWithCurrent, min, max)]}
                    stroke={isCurrent ? "var(--accent-ink)" : "var(--surface)"}
                    strokeWidth={isCurrent ? 3 : 1}
                    className="transition-opacity hover:opacity-75"
                  >
                    <title>
                      {isCurrent ? `${row.country.toUpperCase()} — the chart you are viewing` : label(row)}
                    </title>
                  </path>
                </Link>
              );
            })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 text-[11.5px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span>{min} apps</span>
          {STEPS.map((step) => (
            <span key={step} className="size-3.5 rounded-sm" style={{ background: step }} />
          ))}
          <span>{max}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3.5 rounded-sm" style={{ background: "var(--map-none)" }} />
          no chart data
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-3.5 rounded-sm border-2"
            style={{ background: "var(--accent-soft)", borderColor: "var(--accent-ink)" }}
          />
          viewing
        </span>
      </div>

      {/* Colour alone is never the only way to read this. */}
      <details className="pt-3">
        <summary className="cursor-pointer text-[12.5px] text-ink-muted hover:text-ink">
          Show the numbers
        </summary>
        <table className="mt-2 w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-wide text-ink-faint">
              <th className="py-1.5 font-medium">Country</th>
              <th className="py-1.5 text-right font-medium">Shared with {current.toUpperCase()}</th>
              <th className="py-1.5 text-right font-medium">Charting apps</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((row) => (
              <tr key={row.country} className="border-b border-line last:border-0">
                <td className="py-1.5">
                  <Link href={`${hrefFor}${row.country}`} className="hover:text-accent-ink">
                    {row.country.toUpperCase()}
                  </Link>
                  {row.country === current && <span className="pl-2 text-[11.5px] text-ink-faint">viewing</span>}
                </td>
                <td className="py-1.5 text-right tabular-nums">{row.sharedWithCurrent}</td>
                <td className="py-1.5 text-right tabular-nums">{row.apps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
