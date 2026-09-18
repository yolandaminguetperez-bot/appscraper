import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import type { TrendRow } from "@/lib/db/trends-query";
import { compactNumber, daysAgo, money, rating } from "@/lib/format";

export function TrendTable({ rows }: { rows: TrendRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center text-sm text-ink-muted">
        Not enough history yet for this window.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-muted/60 text-left text-[12px] uppercase tracking-wide text-ink-muted">
            <th className="w-12 px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">App</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 text-right font-medium">Growth</th>
            <th className="px-4 py-3 text-right font-medium">Reviews gained</th>
            <th className="px-4 py-3 text-right font-medium">Rating</th>
            <th className="px-4 py-3 text-right font-medium">MRR</th>
            <th className="px-4 py-3 text-right font-medium">Released</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.app.id} className="border-b border-line last:border-0 hover:bg-surface-muted/40">
              <td className="px-4 py-3 tabular-nums text-ink-faint">{index + 1}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/apps/${encodeURIComponent(row.app.id)}`}
                  className="block truncate font-medium hover:text-accent-ink"
                >
                  {row.app.title}
                </Link>
                <span className="block truncate text-[12px] text-ink-muted">{row.app.developer}</span>
              </td>
              <td className="px-4 py-3 text-[13px] text-ink-muted">{row.app.category ?? "—"}</td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[12.5px] font-medium text-accent-ink tabular-nums">
                  <ArrowUpRight className="size-3" />
                  {(row.growth * 100).toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{compactNumber(row.gained)}</td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 text-accent" />
                  {rating(row.app.rating)}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{money(row.app.estMrr)}</td>
              <td className="px-4 py-3 text-right text-[13px] text-ink-muted">
                {daysAgo(row.app.releasedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
