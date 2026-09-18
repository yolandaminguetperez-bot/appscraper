"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useSelection } from "@/components/selection/selection-provider";
import { MAX_APPS } from "@/lib/compare";

/** Appears only once something is selected, so it costs nothing until used. */
export function SelectionBar() {
  const { ids, clear, ready } = useSelection();
  if (!ready || ids.length === 0) return null;

  const comparable = ids.slice(0, MAX_APPS);
  // The compare page reads repeated `app` parameters; `ids` silently renders an
  // empty comparison.
  const query = comparable.map((id) => `app=${encodeURIComponent(id)}`).join("&");
  const overflow = ids.length - comparable.length;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-panel-line bg-panel px-4 py-2.5 text-panel-ink shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)]">
        <span className="text-[13px]">
          {ids.length} selected
          {overflow > 0 && (
            <span className="pl-1.5 text-[11.5px] text-panel-ink-muted">
              · comparing the first {MAX_APPS}
            </span>
          )}
        </span>
        <Link
          href={`/dashboard/compare?${query}`}
          className="rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-medium text-panel transition-colors hover:bg-accent-ink hover:text-white"
        >
          Compare
        </Link>
        <button
          type="button"
          onClick={clear}
          aria-label="Clear selection"
          className="grid size-7 place-items-center rounded-full text-panel-ink-muted transition-colors hover:bg-panel-soft hover:text-panel-ink"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
