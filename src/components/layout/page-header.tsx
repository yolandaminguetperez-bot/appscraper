import type { ReactNode } from "react";
import { RefreshButton } from "@/components/layout/refresh-button";

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
    <div className="flex items-start justify-between gap-4 px-5 pt-6 max-md:pl-16 md:px-7">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <RefreshButton />
      </div>
    </div>
  );
}
