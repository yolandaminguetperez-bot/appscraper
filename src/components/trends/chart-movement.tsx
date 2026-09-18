import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, LogIn, LogOut } from "lucide-react";
import { AppIcon } from "@/components/ui/app-icon";
import type { ChartMovement as Movement } from "@/lib/db/trends-query";

function Row({
  id,
  title,
  iconUrl,
  position,
  badge,
  tone,
}: {
  id: string;
  title: string;
  iconUrl: string | null | undefined;
  position: number;
  badge: string;
  tone: "pos" | "neg" | "flat";
}) {
  return (
    <li className="flex items-center gap-2.5 py-1.5">
      <span className="metric w-7 shrink-0 text-right text-[12px] text-ink-faint">#{position}</span>
      <AppIcon id={id} title={title} iconUrl={iconUrl} className="size-7" />
      <Link
        href={`/dashboard/apps/${encodeURIComponent(id)}`}
        className="min-w-0 flex-1 truncate text-[12.5px] font-medium hover:text-accent-ink"
      >
        {title}
      </Link>
      <span
        className={`metric shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
          tone === "pos"
            ? "bg-pos-soft text-pos"
            : tone === "neg"
              ? "bg-neg-soft text-neg"
              : "bg-surface-muted text-ink-faint"
        }`}
      >
        {badge}
      </span>
    </li>
  );
}

function Panel({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--raise-1)]">
      <h3 className="flex items-center gap-1.5 pb-1 text-[13px] font-semibold">
        {icon}
        {title}
      </h3>
      {empty ? (
        <p className="py-3 text-[12px] text-ink-faint">Nothing moved here.</p>
      ) : (
        <ul className="divide-y divide-line">{children}</ul>
      )}
    </section>
  );
}

/** What changed in this chart since a week ago: who climbed, fell, joined, left. */
export function ChartMovement({ movement }: { movement: Movement }) {
  const since = new Date(movement.comparedTo + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 pb-2.5">
        <h2 className="text-[15px] font-semibold">What moved</h2>
        <p className="text-[12px] text-ink-muted">since {since}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Panel
          title="Climbing"
          icon={<ArrowUpRight className="size-3.5 text-pos" />}
          empty={movement.climbers.length === 0}
        >
          {movement.climbers.map((move) => (
            <Row
              key={move.app.id}
              id={move.app.id}
              title={move.app.title}
              iconUrl={move.app.iconUrl}
              position={move.position}
              badge={`+${move.change}`}
              tone="pos"
            />
          ))}
        </Panel>

        <Panel
          title="Falling"
          icon={<ArrowDownRight className="size-3.5 text-neg" />}
          empty={movement.fallers.length === 0}
        >
          {movement.fallers.map((move) => (
            <Row
              key={move.app.id}
              id={move.app.id}
              title={move.app.title}
              iconUrl={move.app.iconUrl}
              position={move.position}
              badge={String(move.change)}
              tone="neg"
            />
          ))}
        </Panel>

        <Panel
          title="New on the chart"
          icon={<LogIn className="size-3.5 text-ink-muted" />}
          empty={movement.entries.length === 0}
        >
          {movement.entries.map((move) => (
            <Row
              key={move.app.id}
              id={move.app.id}
              title={move.app.title}
              iconUrl={move.app.iconUrl}
              position={move.position}
              badge="new"
              tone="flat"
            />
          ))}
        </Panel>

        <Panel
          title="Dropped out"
          icon={<LogOut className="size-3.5 text-ink-muted" />}
          empty={movement.exits.length === 0}
        >
          {movement.exits.map((exit) => (
            <Row
              key={exit.app.id}
              id={exit.app.id}
              title={exit.app.title}
              iconUrl={exit.app.iconUrl}
              position={exit.previousPosition}
              badge="out"
              tone="flat"
            />
          ))}
        </Panel>
      </div>
    </div>
  );
}
