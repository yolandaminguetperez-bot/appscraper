import { db } from "@/lib/db";
import { invalidateCache } from "@/lib/db/cache";

export type AlertKind = "app" | "keyword";
export type AlertMetric = "downloads" | "revenue" | "reviews" | "rating" | "position";

export type Alert = {
  id: string;
  kind: AlertKind;
  appId: string;
  appTitle: string;
  iconUrl: string | null;
  term: string | null;
  metric: AlertMetric;
  direction: "up" | "down";
  threshold: number;
  windowDays: number;
  createdAt: string;
};

export type AlertHit = Alert & {
  /** What the metric is now, and what it was at the start of the window. */
  current: number;
  previous: number;
  /** Signed movement in the rule's own unit: percent, or places for a position. */
  change: number;
  firing: boolean;
};

type Row = Record<string, unknown>;

const METRIC_COLUMN: Record<Exclude<AlertMetric, "position">, string> = {
  downloads: "est_downloads",
  revenue: "est_revenue",
  reviews: "rating_count",
  rating: "rating",
};

function rowToAlert(row: Row): Alert {
  return {
    id: row.id as string,
    kind: row.kind as AlertKind,
    appId: row.app_id as string,
    appTitle: (row.app_title as string) ?? (row.app_id as string),
    iconUrl: (row.icon_url as string) ?? null,
    term: (row.term as string) ?? null,
    metric: row.metric as AlertMetric,
    direction: row.direction as "up" | "down",
    threshold: row.threshold as number,
    windowDays: (row.window_days as number) ?? 7,
    createdAt: row.created_at as string,
  };
}

export function listAlerts(): Alert[] {
  const rows = db()
    .prepare(
      `SELECT al.*, a.title AS app_title, a.icon_url
       FROM alerts al JOIN apps a ON a.id = al.app_id
       ORDER BY al.created_at DESC`,
    )
    .all() as Row[];
  return rows.map(rowToAlert);
}

export function createAlert(input: {
  kind: AlertKind;
  appId: string;
  term?: string | null;
  metric: AlertMetric;
  direction: "up" | "down";
  threshold: number;
  windowDays?: number;
}): void {
  invalidateCache();
  db()
    .prepare(
      `INSERT INTO alerts (id, kind, app_id, term, metric, direction, threshold, window_days, created_at)
       VALUES (@id, @kind, @app_id, @term, @metric, @direction, @threshold, @window_days, @created_at)`,
    )
    .run({
      // One rule per app+metric+term: setting the same alert twice should edit
      // it, not quietly leave two rules that both fire.
      id: `${input.appId}:${input.metric}:${input.term ?? ""}`,
      kind: input.kind,
      app_id: input.appId,
      term: input.term ?? null,
      metric: input.metric,
      direction: input.direction,
      threshold: input.threshold,
      window_days: input.windowDays ?? 7,
      created_at: new Date().toISOString(),
    });
}

export function deleteAlert(id: string): void {
  invalidateCache();
  db().prepare("DELETE FROM alerts WHERE id = ?").run(id);
}

/**
 * Evaluates every rule against the current data.
 *
 * A rating is compared in points and a position in places; everything else in
 * percent, because a 50,000 download gain means nothing without knowing whether
 * the app had 50,000 or 50 million.
 */
export function evaluateAlerts(): AlertHit[] {
  const alerts = listAlerts();
  if (alerts.length === 0) return [];

  return alerts.map((alert) => {
    const since = new Date(Date.now() - alert.windowDays * 86400000).toISOString().slice(0, 10);

    let current = 0;
    let previous = 0;

    if (alert.metric === "position" && alert.term) {
      const row = db()
        .prepare(
          `SELECT
             (SELECT position FROM keyword_ranks r JOIN keywords k ON k.id = r.keyword_id
               WHERE r.app_id = ? AND k.term = ? ORDER BY r.day DESC LIMIT 1) AS current,
             (SELECT position FROM keyword_ranks r JOIN keywords k ON k.id = r.keyword_id
               WHERE r.app_id = ? AND k.term = ? AND r.day >= ? ORDER BY r.day ASC LIMIT 1) AS previous`,
        )
        .get(alert.appId, alert.term, alert.appId, alert.term, since) as Row;
      current = (row?.current as number) ?? 0;
      previous = (row?.previous as number) ?? current;
    } else {
      const column = METRIC_COLUMN[alert.metric as Exclude<AlertMetric, "position">];
      const row = db()
        .prepare(
          `SELECT
             (SELECT ${column} FROM app_metrics WHERE app_id = ? ORDER BY day DESC LIMIT 1) AS current,
             (SELECT ${column} FROM app_metrics WHERE app_id = ? AND day >= ? ORDER BY day ASC LIMIT 1) AS previous`,
        )
        .get(alert.appId, alert.appId, since) as Row;
      current = (row?.current as number) ?? 0;
      previous = (row?.previous as number) ?? current;
    }

    // Climbing a search result means the number goes down, so the sign is
    // flipped: a rule watching for "up" on a position wants 40 -> 12.
    let change: number;
    if (alert.metric === "position") change = previous - current;
    else if (alert.metric === "rating") change = current - previous;
    else change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    const firing =
      alert.direction === "up" ? change >= alert.threshold : change <= -alert.threshold;

    return { ...alert, current, previous, change, firing };
  });
}

export function firingCount(): number {
  return evaluateAlerts().filter((hit) => hit.firing).length;
}
