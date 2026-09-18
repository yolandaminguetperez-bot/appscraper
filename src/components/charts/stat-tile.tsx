import { NavIcon } from "@/components/ui/icon";
import { MiniChart } from "@/components/charts/mini-chart";

/** Label, value, and optionally the shape behind it. One number, no chart chrome. */
export function StatTile({
  label,
  value,
  icon,
  note,
  trend,
}: {
  label: string;
  value: string;
  icon?: string;
  note?: string;
  trend?: number[];
}) {
  return (
    <article className="surface-card p-5">
      <div className="flex items-center gap-2 text-ink-muted">
        {icon && <NavIcon name={icon} className="size-4 text-accent" />}
        <p className="text-[12.5px]">{label}</p>
      </div>
      <p className="pt-2 text-[26px] font-semibold leading-none">{value}</p>
      {note && <p className="pt-1.5 text-[12px] text-ink-faint">{note}</p>}
      {trend && trend.length > 1 && (
        <MiniChart values={trend} label={`${label} trend`} className="mt-3 h-8 w-full" />
      )}
    </article>
  );
}
