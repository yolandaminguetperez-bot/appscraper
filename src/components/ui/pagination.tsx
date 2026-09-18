import Link from "next/link";
import { cn } from "@/lib/cn";
import { PerPageSelect } from "@/components/ui/per-page-select";

export function Pagination({
  page,
  pages,
  total,
  makeHref,
  perPage,
  perPageOptions,
}: {
  page: number;
  pages: number;
  total: number;
  makeHref: (page: number) => string;
  perPage?: number;
  perPageOptions?: number[];
}) {
  // The size selector belongs next to the count even when there is a single
  // page: that is exactly when someone wants to raise it.
  const sizer =
    perPage && perPageOptions?.length ? (
      <PerPageSelect value={perPage} options={perPageOptions} />
    ) : null;

  if (pages <= 1) {
    return (
      <div className="flex items-center justify-between pt-4">
        <p className="text-[13px] text-ink-muted">{total.toLocaleString()} results</p>
        {sizer}
      </div>
    );
  }

  const window = [page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages);
  const numbers = [...new Set([1, ...window, pages])].sort((a, b) => a - b);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-[13px] text-ink-muted">
        {total.toLocaleString()} results · page {page} of {pages}
      </p>
      <div className="flex items-center gap-4">
        {sizer}
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
    </div>
  );
}
