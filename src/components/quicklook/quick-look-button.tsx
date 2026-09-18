"use client";

import { PanelRightOpen } from "lucide-react";
import { useQuickLook } from "@/components/quicklook/quick-look-provider";

export function QuickLookButton({ id, title }: { id: string; title: string }) {
  const { open } = useQuickLook();

  return (
    <button
      type="button"
      onClick={() => open(id)}
      aria-label={`Quick look at ${title}`}
      className="grid size-7 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
    >
      <PanelRightOpen className="size-4" />
    </button>
  );
}
