import Link from "next/link";
import type { Flow } from "@/lib/db/flows-query";
import { ScreenStrip } from "@/components/flows/screen-strip";
import { AppIcon } from "@/components/ui/app-icon";
import { compactNumber, daysAgo, money } from "@/lib/format";

/** A flow reads as a filmstrip: the order of screens is the thing worth studying. */
export function FlowCard({ flow }: { flow: Flow }) {
  return (
    <article className="surface-card p-4">
      <header className="flex items-start justify-between gap-3">
        <AppIcon id={flow.app.id} title={flow.app.title} iconUrl={flow.app.iconUrl} className="size-10" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/apps/${encodeURIComponent(flow.appId)}`}
            className="block truncate font-medium hover:text-accent-ink"
          >
            {flow.app.title}
          </Link>
          <p className="truncate text-[12.5px] text-ink-muted">
            {flow.app.category} · {compactNumber(flow.app.estDownloads)} downloads ·{" "}
            {money(flow.app.estMrr)} MRR
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-[11.5px] text-ink-muted">
          {flow.kind === "web-funnel" ? "Web funnel" : "Onboarding"} · {flow.screens.length} screens
        </span>
      </header>

      <div className="mt-4">
        <ScreenStrip screens={flow.screens} title={flow.app.title} />
      </div>

      <p className="pt-1 text-[11.5px] text-ink-faint">Captured {daysAgo(flow.capturedAt)}</p>
    </article>
  );
}
