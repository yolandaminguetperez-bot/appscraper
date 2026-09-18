import Link from "next/link";
import type { Flow } from "@/lib/db/flows-query";
import { compactNumber, daysAgo, money } from "@/lib/format";

/** A flow reads as a filmstrip: the order of screens is the thing worth studying. */
export function FlowCard({ flow }: { flow: Flow }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
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

      <ol className="scroll-thin mt-4 flex gap-2.5 overflow-x-auto pb-2">
        {flow.screens.map((screen) => (
          <li key={screen.id} className="w-[104px] shrink-0">
            <div className="flex aspect-[9/16] flex-col justify-between rounded-xl border border-panel-line bg-panel p-2 text-panel-ink">
              <span className="text-[10px] text-panel-ink-muted">
                {String(screen.position + 1).padStart(2, "0")}
              </span>
              <span className="text-[11px] leading-tight">{screen.screenType}</span>
            </div>
          </li>
        ))}
      </ol>

      <p className="pt-1 text-[11.5px] text-ink-faint">Captured {daysAgo(flow.capturedAt)}</p>
    </article>
  );
}
