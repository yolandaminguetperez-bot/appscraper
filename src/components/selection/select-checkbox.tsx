"use client";

import { Check } from "lucide-react";
import { useSelection } from "@/components/selection/selection-provider";
import { cn } from "@/lib/cn";

export function SelectCheckbox({ id, title, className }: { id: string; title: string; className?: string }) {
  const { has, toggle, ready } = useSelection();
  const selected = ready && has(id);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`Select ${title} for comparison`}
      onClick={() => toggle(id)}
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors",
        selected
          ? "border-accent bg-accent text-panel"
          : "border-line bg-surface text-transparent hover:border-accent/50",
        className,
      )}
    >
      <Check className="size-3" strokeWidth={3} />
    </button>
  );
}
