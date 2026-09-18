import Link from "next/link";
import world from "@/lib/geo/world.json";
import { MapOverlay, type MapShape } from "@/components/trends/map-overlay";

export type MapValue = {
  /** ISO 3166-1 alpha-2, lowercase. */
  code: string;
  value: number;
  /** Full sentence shown on hover and read in the table. */
  label: string;
  href?: string;
};

/**
 * Choropleth on Equal Earth.
 *
 * Magnitude, so one hue light-to-dark rather than a spread of hues. Geometry is
 * projected and simplified at build time (scripts/make-world-geo.mjs), so this
 * renders on the server with no map library and no client JavaScript: hovering
 * a country uses the SVG's own <title>, and clicking one is an ordinary link.
 */
const STEPS = ["var(--map-1)", "var(--map-2)", "var(--map-3)", "var(--map-4)"] as const;

function bucketOf(value: number, min: number, max: number): number {
  if (max <= min) return STEPS.length - 1;
  const share = (value - min) / (max - min);
  return Math.min(STEPS.length - 1, Math.floor(share * STEPS.length));
}

export function WorldMap({
  title,
  description,
  values,
  valueHeading,
  /** Drawn as an outline instead of a shade — see below. */
  marked,
  markedNote = "viewing",
}: {
  title: string;
  description: string;
  values: MapValue[];
  valueHeading: string;
  marked?: string;
  markedNote?: string;
}) {
  // A marked country is excluded from the scale on purpose: on the rankings map
  // it is the country being viewed, which overlaps itself completely and would
  // push every other country into the bottom step.
  const scaled = values.filter((row) => row.code !== marked);
  if (scaled.length === 0) return null;

  const min = Math.min(...scaled.map((row) => row.value));
  const max = Math.max(...scaled.map((row) => row.value));
  const byCode = new Map(values.map((row) => [row.code, row]));

  // Only serializable data crosses into the client overlay: passing a render
  // function here is what "Functions cannot be passed to Client Components"
  // means in practice.
  const shapes: MapShape[] = world.countries
    .filter((country) => byCode.has(country.code))
    .map((country) => {
      const row = byCode.get(country.code)!;
      const isMarked = country.code === marked;
      return {
        code: country.code,
        d: country.d,
        fill: isMarked ? "var(--accent-soft)" : STEPS[bucketOf(row.value, min, max)],
        stroke: isMarked ? "var(--accent-ink)" : "var(--surface)",
        strokeWidth: isMarked ? 3 : 1,
        label: row.label,
        href: row.href,
      };
    });

  return (
    <section className="surface-card p-5">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <p className="pt-0.5 text-[12.5px] text-ink-muted">{description}</p>

      {/* The unshaded base is an image: 175 country paths inlined here would be
          serialised into the HTML and again into the RSC payload, ~156KB per
          view, for geometry that never changes. Only the countries with data
          stay inline, where they can be hovered and clicked. */}
      <div data-map className="relative mt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/api/world-map" alt="" width={world.width} height={world.height} className="w-full" />
        <MapOverlay width={world.width} height={world.height} shapes={shapes} ariaLabel={title} />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 text-[11.5px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="tabular-nums">{min.toLocaleString()}</span>
          {STEPS.map((step) => (
            <span key={step} className="size-3.5 rounded-sm" style={{ background: step }} />
          ))}
          <span className="tabular-nums">{max.toLocaleString()}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3.5 rounded-sm" style={{ background: "var(--map-none)" }} />
          no data
        </span>
        {marked && (
          <span className="flex items-center gap-1.5">
            <span
              className="size-3.5 rounded-sm border-2"
              style={{ background: "var(--accent-soft)", borderColor: "var(--accent-ink)" }}
            />
            {markedNote}
          </span>
        )}
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
              <th className="py-1.5 text-right font-medium">{valueHeading}</th>
            </tr>
          </thead>
          <tbody>
            {[...values]
              .sort((a, b) => b.value - a.value)
              .map((row) => (
                <tr key={row.code} className="border-b border-line last:border-0">
                  <td className="py-1.5">
                    {row.href ? (
                      <Link href={row.href} className="hover:text-accent-ink">
                        {row.code.toUpperCase()}
                      </Link>
                    ) : (
                      row.code.toUpperCase()
                    )}
                    {row.code === marked && (
                      <span className="pl-2 text-[11.5px] text-ink-faint">{markedNote}</span>
                    )}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{row.value.toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
