import Link from "next/link";
import { AppIcon } from "@/components/ui/app-icon";
import type { CountrySummary } from "@/lib/db/trends-query";

/** Two ASCII letters map onto the regional-indicator range, so no flag assets. */
function flag(code: string): string {
  if (code.length !== 2) return "🏳️";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

export function CountryStrip({
  countries,
  current,
  hrefFor,
}: {
  countries: CountrySummary[];
  current: string;
  hrefFor: string;
}) {
  if (countries.length === 0) return null;
  const peak = Math.max(...countries.map((c) => c.apps), 1);

  return (
    <section className="surface-card p-5">
      <h2 className="text-[15px] font-semibold">This chart around the world</h2>
      <p className="pt-0.5 text-[12.5px] text-ink-muted">
        How much each country&apos;s chart overlaps with {current.toUpperCase()}, and who leads it there.
      </p>

      <ul className="grid gap-2.5 pt-4 sm:grid-cols-2 xl:grid-cols-3">
        {countries.map((row) => (
          <li key={row.country}>
            <Link
              href={`${hrefFor}${row.country}`}
              aria-current={row.country === current ? "true" : undefined}
              className={`block rounded-xl border px-3 py-2.5 transition-colors ${
                row.country === current
                  ? "border-accent/40 bg-accent-soft"
                  : "border-line hover:border-accent/30"
              }`}
            >
              {/* Country and leader on separate lines. Side by side, the leader
                  block would not shrink and crushed the country label down to
                  a single letter at three columns. */}
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="text-[18px] leading-none">
                  {flag(row.country)}
                </span>
                <span className="text-[13px] font-medium">{row.country.toUpperCase()}</span>
                <span className="ml-auto text-[11.5px] text-ink-muted">
                  <span className="metric">
                    {row.country === current ? row.apps : row.sharedWithCurrent}
                  </span>
                  {row.country === current ? " apps" : ` of ${row.apps}`}
                </span>
              </span>

              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface-muted">
                <span
                  className="block h-full rounded-full bg-[var(--chart-fill)]"
                  style={{
                    width: `${Math.max(((row.country === current ? row.apps : row.sharedWithCurrent) / peak) * 100, 2)}%`,
                  }}
                />
              </span>

              {row.leader && (
                <span className="mt-2 flex items-center gap-2">
                  <AppIcon
                    id={row.leader.id}
                    title={row.leader.title}
                    iconUrl={row.leader.iconUrl}
                    className="size-5"
                  />
                  <span className="min-w-0 truncate text-[11.5px] text-ink-muted">
                    leads: {row.leader.title}
                  </span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
