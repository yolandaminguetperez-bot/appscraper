import Link from "next/link";
import { MiniChart } from "@/components/charts/mini-chart";
import type { KeywordRank } from "@/lib/db/aso-query";
import { TermAlertButton } from "@/components/alerts/term-alert-button";

/**
 * Where the app sits in search, per term.
 *
 * The sparkline is inverted before it is drawn: position 1 is the best result,
 * so a falling number is a rising app, and an un-inverted line would show a
 * climb as a collapse.
 */
export function KeywordRanks({
  ranks,
  appId,
  alertedTerms = [],
}: {
  ranks: KeywordRank[];
  appId?: string;
  /** Terms that already have a rule, so the bell does not offer a duplicate. */
  alertedTerms?: string[];
}) {
  if (ranks.length === 0) return null;

  return (
    <ul className="divide-y divide-line">
      {ranks.map((rank) => (
        <li key={rank.term} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="metric w-9 shrink-0 text-[15px] font-semibold">#{rank.position}</span>

          <span className="min-w-0 flex-1">
            <Link
              href={`/dashboard/keywords?term=${encodeURIComponent(rank.term)}`}
              className="block truncate text-[13.5px] font-medium hover:text-accent-ink"
            >
              {rank.term}
            </Link>
            <span className="eyebrow">
              vol {rank.volume ?? "—"} · diff {rank.difficulty ?? "—"}
            </span>
          </span>

          <MiniChart
            values={rank.history.map((position) => 200 - position)}
            label={`Search position for ${rank.term}`}
            className="h-7 w-20 shrink-0"
          />

          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-medium ${
              rank.change > 0
                ? "bg-pos-soft text-pos"
                : rank.change < 0
                  ? "bg-neg-soft text-neg"
                  : "bg-surface-muted text-ink-faint"
            }`}
          >
            <span className="metric">
              {rank.change > 0 ? "+" : ""}
              {rank.change}
            </span>
          </span>

          {appId && (
            <TermAlertButton
              appId={appId}
              term={rank.term}
              alreadySet={alertedTerms.includes(rank.term)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
