import type { ReactNode } from "react";
import { RefreshButton } from "@/components/layout/refresh-button";
import { CommandPalette } from "@/components/command/command-palette";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-6 max-md:pl-16 md:flex-nowrap md:gap-4 md:px-7">
      <div className="min-w-0">
        <h1 className="truncate text-[19px] font-semibold tracking-tight md:text-[22px]">{title}</h1>
        {/* The subtitle is context, not content: on a phone it wrapped to five
            lines and pushed the results below the fold. */}
        {subtitle && <p className="mt-1 hidden text-sm text-ink-muted sm:block">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CommandPalette />
        {actions}
        <RefreshButton />
      </div>
    </div>
  );
}
