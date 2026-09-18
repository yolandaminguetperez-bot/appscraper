import type { CountrySplit } from "@/lib/db/aso-query";
import { compactNumber, money } from "@/lib/format";

/** The countries an app's installs and money come from, biggest first. */
export function MarketSplit({ markets }: { markets: CountrySplit[] }) {
  if (markets.length === 0) return null;
  const peak = Math.max(...markets.map((market) => market.share), 0.0001);

  return (
    <ul className="space-y-2">
      {markets.map((market) => (
        <li key={market.country} className="grid grid-cols-[2.2rem_1fr_auto] items-center gap-3">
          <span className="text-[12.5px] font-medium uppercase">{market.country}</span>
          <span className="h-2 overflow-hidden rounded-full bg-surface-muted">
            <span
              className="block h-full rounded-full bg-chart-line"
              style={{ width: `${(market.share / peak) * 100}%` }}
            />
          </span>
          <span className="metric text-right text-[12px] text-ink-muted">
            {(market.share * 100).toFixed(1)}% · {money(market.revenue)} · {compactNumber(market.downloads)}
          </span>
        </li>
      ))}
    </ul>
  );
}
