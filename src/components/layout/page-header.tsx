import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

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
    <div className="flex items-start justify-between gap-4 px-7 pt-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button
          type="button"
          aria-label="Refresh"
          className="grid size-9 place-items-center rounded-full border border-line bg-surface text-ink-muted transition-colors hover:text-ink"
        >
          <RefreshCw className="size-4" />
        </button>
      </div>
    </div>
  );
}
