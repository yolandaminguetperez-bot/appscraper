"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { NavIcon } from "@/components/ui/icon";

export function FilterPopover({
  label,
  icon,
  badge,
  active,
  children,
}: {
  label: string;
  icon?: string;
  badge?: number;
  active?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
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
          active
            ? "border-accent/40 bg-accent-soft text-accent-ink"
            : "border-line bg-surface text-ink-muted hover:text-ink",
        )}
      >
        {icon && <NavIcon name={icon} className="size-4" />}
        <span>{label}</span>
        {badge ? (
          <span className="grid size-[18px] place-items-center rounded-full bg-accent/20 text-[11px] font-semibold text-accent-ink">
            {badge}
          </span>
        ) : null}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[280px] rounded-2xl border border-line bg-surface p-3 shadow-[0_18px_40px_-20px_rgba(16,21,17,0.35)]">
          {children}
        </div>
      )}
    </div>
  );
}
