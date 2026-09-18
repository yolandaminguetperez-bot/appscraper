"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Secondary filters live behind one control.
 *
 * A row of a dozen identical pills gives the rare filter the same weight as the
 * one everybody uses, and the reader has to scan all of them every time. The
 * badge keeps hidden filters honest — you can always see how many are on.
 */
export function MoreFilters({ activeCount, children }: { activeCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition-colors",
          activeCount > 0 || open
            ? "border-accent/40 bg-accent-soft text-accent-ink"
            : "border-line bg-surface text-ink-muted hover:text-ink",
        )}
      >
        <SlidersHorizontal className="size-4" />
        More filters
        {activeCount > 0 && (
          <span className="grid size-[18px] place-items-center rounded-full bg-accent/20 text-[11px] font-semibold text-accent-ink">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(92vw,640px)] rounded-2xl border border-line bg-surface p-4 shadow-[0_24px_60px_-28px_rgba(16,21,17,0.45)]">
          <div className="flex items-center justify-between pb-3">
            <p className="text-[13px] font-medium">All filters</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close filters"
              className="grid size-7 place-items-center rounded-full text-ink-faint hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
        </div>
      )}
    </div>
  );
}
