import Link from "next/link";
import { cn } from "@/lib/cn";

export function Pagination({
  page,
  pages,
  total,
  makeHref,
}: {
  page: number;
  pages: number;
  total: number;
  makeHref: (page: number) => string;
}) {
  if (pages <= 1) {
    return <p className="pt-4 text-[13px] text-ink-muted">{total.toLocaleString()} results</p>;
  }

  const window = [page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages);
  const numbers = [...new Set([1, ...window, pages])].sort((a, b) => a - b);

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-[13px] text-ink-muted">
        {total.toLocaleString()} results · page {page} of {pages}
      </p>
      <div className="flex items-center gap-1">
        {numbers.map((n, i) => (
          <span key={n} className="flex items-center gap-1">
            {i > 0 && numbers[i - 1] !== n - 1 && <span className="px-1 text-ink-faint">…</span>}
            <Link
              href={makeHref(n)}
              className={cn(
                "grid size-8 place-items-center rounded-lg border text-[13px]",
                n === page
                  ? "border-accent/40 bg-accent-soft text-accent-ink"
                  : "border-line bg-surface text-ink-muted hover:text-ink",
              )}
            >
              {n}
            </Link>
          </span>
        ))}
      </div>
    </div>
  );
}
