import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded-lg bg-surface-muted", className)} />;
}

/** Shared placeholder for the list-and-filters views, which all share a shape. */
export function ListViewSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="px-7 pt-6">
      <Skeleton className="h-11 w-full rounded-full" />
      <div className="flex flex-wrap gap-2 pt-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-full" />
        ))}
      </div>
      <div className="mt-5 space-y-2 rounded-2xl border border-line bg-surface p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}
