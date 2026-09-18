"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Heart, Star, Target, X } from "lucide-react";
import { toggleFavoriteAction } from "@/app/actions/favorites";
import { trackAppAction, untrackAppAction } from "@/app/actions/tracking";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useQuickLook } from "@/components/quicklook/quick-look-provider";
import { MiniChart } from "@/components/charts/mini-chart";
import { compactNumber, daysAgo, money, rating } from "@/lib/format";

type Detail = {
  app: {
    id: string;
    title: string;
    developer: string | null;
    category: string | null;
    store: string;
    iconUrl: string | null;
    rating: number | null;
    ratingCount: number | null;
    estDownloads: number | null;
    estMrr: number | null;
    estRevenue: number | null;
    releasedAt: string | null;
    storeUrl: string | null;
    description: string | null;
  };
  history: { day: string; revenue: number | null; downloads: number | null }[];
  creatives: { id: string; headline: string | null; network: string; daysRunning: number | null }[];
  organic: { id: string; author: string | null; views: number | null; platform: string }[];
  reviews: { id: string; rating: number | null; title: string | null; body: string | null }[];
  markets: { country: string; revenue: number | null; share: number }[];
  keywordRanks: { term: string; position: number; change: number }[];
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2">
      <p className="text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">{label}</p>
      <p className="pt-0.5 text-[15px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function QuickLookPanel() {
  const { openId, close } = useQuickLook();
  const pathname = usePathname();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState(false);
  const [state, setState] = useState<{ favorite: boolean; role: string | null }>({
    favorite: false,
    role: null,
  });

  useEffect(() => {
    if (!openId) return;
    // A new id means the panel is already open on a different app: clear first
    // so it never shows one app's numbers under another app's name.
    setDetail(null);
    setError(false);
    setState({ favorite: false, role: null });

    const controller = new AbortController();
    fetch(`/api/v1/apps/${encodeURIComponent(openId)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body) => setDetail(body.data as Detail))
      .catch((cause) => {
        if ((cause as Error).name !== "AbortError") setError(true);
      });

    fetch(`/api/app-state/${encodeURIComponent(openId)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { favorite: false, role: null }))
      .then(setState)
      .catch(() => {
        // The panel is still useful without the toggles reflecting state.
      });

    return () => controller.abort();
  }, [openId]);

  if (!openId) return null;

  const app = detail?.app;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close quick look"
        onClick={close}
        className="absolute inset-0 bg-panel/40 backdrop-blur-[2px]"
      />
      <aside
        role="dialog"
        aria-label="Quick look"
        className="scroll-thin relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line bg-bg shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start gap-3 border-b border-line bg-bg/95 px-5 py-4 backdrop-blur">
          {app && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={app.iconUrl ?? `/api/icon/${encodeURIComponent(app.id)}`}
              alt=""
              className="size-11 rounded-[12px]"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{app?.title ?? "Loading…"}</p>
            <p className="truncate text-[12.5px] text-ink-muted">
              {app ? [app.developer, app.category].filter(Boolean).join(" · ") : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid size-7 place-items-center rounded-full text-ink-faint hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </header>

        {error && (
          <p className="px-5 py-6 text-[13px] text-ink-muted">
            That app could not be loaded. It may have been removed from the catalogue.
          </p>
        )}

        {!detail && !error && (
          <div className="space-y-3 px-5 py-5">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-16 animate-pulse rounded-xl bg-surface-muted" />
            ))}
          </div>
        )}

        {detail && app && (
          <div className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Downloads" value={compactNumber(app.estDownloads)} />
              <Stat label="MRR" value={money(app.estMrr)} />
              <Stat label="Lifetime" value={money(app.estRevenue)} />
              <Stat label="Released" value={daysAgo(app.releasedAt)} />
            </div>

            <div className="surface-card p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[13px] font-medium">Revenue, 90 days</p>
                <p className="flex items-center gap-1 text-[12.5px] text-ink-muted">
                  <Star className="size-3.5 text-accent" />
                  {rating(app.rating)} ({compactNumber(app.ratingCount)})
                </p>
              </div>
              <MiniChart
                values={detail.history.map((point) => point.revenue ?? 0)}
                label={`Revenue trend for ${app.title}`}
                className="mt-2 h-12 w-full"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Ads", detail.creatives.length],
                ["Creator videos", detail.organic.length],
                ["Reviews sampled", detail.reviews.length],
              ].map(([label, count]) => (
                <div key={label as string} className="rounded-xl border border-line bg-surface px-2 py-2">
                  <p className="text-[15px] font-semibold tabular-nums">{count as number}</p>
                  <p className="text-[10.5px] text-ink-faint">{label as string}</p>
                </div>
              ))}
            </div>

            {detail.markets?.length > 0 && (
              <section className="surface-card p-4">
                <p className="pb-2 text-[13px] font-medium">Top markets</p>
                <ul className="space-y-1.5">
                  {detail.markets.slice(0, 3).map((market) => (
                    <li key={market.country} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2">
                      <span className="text-[12px] font-medium uppercase">{market.country}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                        <span
                          className="block h-full rounded-full bg-chart-line"
                          style={{ width: `${Math.round(market.share * 100)}%` }}
                        />
                      </span>
                      <span className="metric text-[11.5px] text-ink-muted">
                        {(market.share * 100).toFixed(0)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {detail.keywordRanks?.length > 0 && (
              <section className="surface-card p-4">
                <p className="pb-2 text-[13px] font-medium">Search positions</p>
                <ul className="space-y-1.5">
                  {detail.keywordRanks.slice(0, 4).map((rank) => (
                    <li key={rank.term} className="flex items-baseline gap-2 text-[12.5px]">
                      <span className="metric w-8 shrink-0 font-semibold">#{rank.position}</span>
                      <span className="min-w-0 flex-1 truncate">{rank.term}</span>
                      <span className={`metric shrink-0 text-[11.5px] ${rank.change > 0 ? "text-pos" : rank.change < 0 ? "text-neg" : "text-ink-faint"}`}>
                        {rank.change > 0 ? "+" : ""}
                        {rank.change}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {detail.creatives.length > 0 && (
              <section className="surface-card p-4">
                <p className="pb-2 text-[13px] font-medium">Running creatives</p>
                <ul className="space-y-1.5">
                  {detail.creatives.slice(0, 4).map((creative) => (
                    <li key={creative.id} className="flex items-baseline gap-2 text-[12.5px]">
                      <span className="min-w-0 flex-1 truncate">{creative.headline ?? "Untitled"}</span>
                      <span className="shrink-0 text-ink-faint">
                        {creative.network} · {creative.daysRunning ?? 0}d
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {app.description && (
              <p className="line-clamp-4 text-[12.5px] leading-relaxed text-ink-muted">{app.description}</p>
            )}

            {/* The panel is where you decide about an app, so the decisions
                belong here rather than back on the row. */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setState((current) => ({ ...current, favorite: !current.favorite }));
                  void toggleFavoriteAction("app", app.id, pathname);
                }}
                aria-pressed={state.favorite}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[12.5px] transition-colors",
                  state.favorite
                    ? "border-accent/40 bg-accent-soft text-accent-ink"
                    : "border-line text-ink-muted hover:text-ink",
                )}
              >
                <Heart className={cn("size-3.5", state.favorite && "fill-current")} />
                {state.favorite ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = state.role === "competitor" ? null : "competitor";
                  setState((current) => ({ ...current, role: next }));
                  void (next ? trackAppAction(app.id, "competitor") : untrackAppAction(app.id));
                }}
                aria-pressed={state.role === "competitor"}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[12.5px] transition-colors",
                  state.role === "competitor"
                    ? "border-accent/40 bg-accent-soft text-accent-ink"
                    : "border-line text-ink-muted hover:text-ink",
                )}
              >
                <Target className="size-3.5" />
                {state.role === "competitor" ? "Tracking" : "Track as competitor"}
              </button>
            </div>

            <div className="flex gap-2 pb-2">
              <Link
                href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
                onClick={close}
                className="flex-1 rounded-full bg-accent px-4 py-2 text-center text-[13px] font-medium text-panel transition-colors hover:bg-accent-ink hover:text-white"
              >
                Open full page
              </Link>
              {app.storeUrl && (
                <a
                  href={app.storeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] text-ink-muted transition-colors hover:text-ink"
                >
                  Store
                  <ArrowUpRight className="size-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
