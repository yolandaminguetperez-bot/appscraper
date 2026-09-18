import Link from "next/link";
import { BellOff } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AppIcon } from "@/components/ui/app-icon";
import { DeleteAlert } from "@/components/alerts/alert-row";
import { evaluateAlerts, type AlertHit } from "@/lib/db/alerts-query";

export const dynamic = "force-dynamic";

const METRIC_LABEL: Record<string, string> = {
  downloads: "downloads",
  revenue: "revenue",
  reviews: "reviews",
  rating: "rating",
  position: "search position",
};

function describe(alert: AlertHit): string {
  // Percent hugs its number, words do not: "10%" but "4 places".
  const unit = alert.metric === "rating" ? " pts" : alert.metric === "position" ? " places" : "%";
  const verb = alert.direction === "up" ? "gains" : "loses";
  const subject = alert.term ? `“${alert.term}”` : METRIC_LABEL[alert.metric];
  return `when ${subject} ${verb} ${alert.threshold}${unit} in ${alert.windowDays} days`;
}

function movement(alert: AlertHit): string {
  const unit = alert.metric === "rating" ? " pts" : alert.metric === "position" ? " places" : "%";
  const sign = alert.change > 0 ? "+" : "";
  const size = alert.metric === "rating" ? alert.change.toFixed(2) : Math.round(alert.change);
  return `${sign}${size}${unit}`;
}

function AlertCard({ alert }: { alert: AlertHit }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
        alert.firing ? "border-accent/40 bg-accent-soft/40" : "border-line bg-surface"
      }`}
    >
      <AppIcon id={alert.appId} title={alert.appTitle} iconUrl={alert.iconUrl} className="size-10" />

      <div className="min-w-0 flex-1">
        <Link
          href={`/dashboard/apps/${encodeURIComponent(alert.appId)}`}
          className="block truncate text-[13.5px] font-semibold hover:text-accent-ink"
        >
          {alert.appTitle}
        </Link>
        <span className="block truncate text-[12px] text-ink-muted">{describe(alert)}</span>
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium ${
          alert.firing
            ? alert.change >= 0
              ? "bg-pos-soft text-pos"
              : "bg-neg-soft text-neg"
            : "bg-surface-muted text-ink-faint"
        }`}
      >
        <span className="metric">{movement(alert)}</span>
      </span>

      <DeleteAlert id={alert.id} label={`${alert.appTitle} ${METRIC_LABEL[alert.metric]}`} />
    </li>
  );
}

export default async function AlertsPage() {
  const alerts = evaluateAlerts();
  const firing = alerts.filter((alert) => alert.firing);
  const quiet = alerts.filter((alert) => !alert.firing);

  return (
    <div className="pb-12">
      <PageHeader
        title="Alerts"
        subtitle={
          alerts.length === 0
            ? "Rules that watch an app for you."
            : `${firing.length} of ${alerts.length} firing right now.`
        }
      />

      <div className="space-y-6 px-7 pt-5">
        {alerts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center">
            <BellOff className="mx-auto size-6 text-ink-faint" />
            <p className="pt-3 text-sm font-medium">No alerts yet</p>
            <p className="mx-auto max-w-sm pt-1 text-[13px] text-ink-muted">
              Open any app and use <span className="font-medium">Alert me</span> to watch its
              downloads, revenue, reviews or rating. Rules are checked against the last days of
              history every time you open the dashboard.
            </p>
            <Link
              href="/dashboard/apps"
              className="mt-4 inline-block rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-panel transition-colors hover:bg-accent-ink hover:text-white"
            >
              Browse apps
            </Link>
          </div>
        )}

        {firing.length > 0 && (
          <section>
            <h2 className="eyebrow pb-2">Firing now</h2>
            <ul className="grid gap-2 lg:grid-cols-2">
              {firing.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </ul>
          </section>
        )}

        {quiet.length > 0 && (
          <section>
            <h2 className="eyebrow pb-2">Watching, nothing to report</h2>
            <ul className="grid gap-2 lg:grid-cols-2">
              {quiet.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
