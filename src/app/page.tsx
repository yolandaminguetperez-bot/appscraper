import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { countApps } from "@/lib/db/apps-repo";
import { queryApps } from "@/lib/db/app-query";
import { metricsForApps } from "@/lib/db/app-query";
import { overviewTotals, revenueByCategory } from "@/lib/db/overview-query";
import { compactNumber, money, rating } from "@/lib/format";
import { AppIcon } from "@/components/ui/app-icon";
import { MiniChart } from "@/components/charts/mini-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { NavIcon } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: "apps", title: "Both stores, one catalogue", body: "The same fourteen filters across App Store and Google Play, exportable as CSV." },
  { icon: "ads", title: "Ads that play", body: "Every creative on file, running inline with its copy, format and days live." },
  { icon: "organic", title: "Creator videos", body: "The organic posts driving installs, by views, likes or creator size." },
  { icon: "onboardings", title: "Onboarding flows", body: "Screen by screen, filterable by the screen types you care about." },
  { icon: "trending", title: "Trending and charts", body: "Who is gaining users fastest, and the top charts by country and store." },
  { icon: "reviews", title: "Review analytics", body: "Rating mix, sentiment split, and the topics behind the complaints." },
  { icon: "key", title: "Keyword explorer", body: "How crowded a term is, and which apps own it today." },
  { icon: "mcp", title: "API and MCP", body: "Every view is a query you can run from code or hand to an agent." },
];

export default async function LandingPage() {
  const total = countApps();
  const totals = overviewTotals();
  const categories = revenueByCategory(5);
  const preview = queryApps({ sort: "revenue", perPage: 4 }).apps;
  const trends = metricsForApps(preview.map((app) => app.id), { days: 30 });

  return (
    <div className="dotted-canvas min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-panel">
            <span className="size-3.5 rounded-[5px] bg-accent" />
          </span>
          AppScraper
        </span>
        <Link
          href="/dashboard/overview"
          className="rounded-full bg-panel px-4 py-2 text-[13px] font-medium text-panel-ink hover:bg-panel-soft"
        >
          Open dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="pt-14 text-center">
          <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-[12.5px] font-medium text-accent-ink">
            Free · no account · no limits
          </span>
          <h1 className="mx-auto max-w-3xl pt-5 text-[44px] font-semibold leading-[1.06] tracking-tight sm:text-[52px]">
            Everything that sells on the stores, and why it sells.
          </h1>
          <p className="mx-auto max-w-2xl pt-5 text-[17px] leading-relaxed text-ink-muted">
            Search {compactNumber(total)} apps, the ads they run, the creators posting about them and the
            onboarding flows they ship — then export it or query it from your own code.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-7">
            <Link
              href="/dashboard/apps"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-[14px] font-medium text-panel transition-colors hover:bg-accent-ink hover:text-white"
            >
              Start exploring
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard/api"
              className="rounded-full border border-line bg-surface px-6 py-3 text-[14px] font-medium hover:border-accent/40"
            >
              Read the API docs
            </Link>
          </div>
        </section>

        {/* The product, not a description of it: real rows from the real catalogue. */}
        <section className="pt-14" aria-label="A look at the dashboard">
          <div className="surface-card overflow-hidden p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="space-y-2">
                <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  Top apps by lifetime revenue
                </p>
                {preview.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
                  >
                    <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{app.title}</p>
                      <p className="truncate text-[12px] text-ink-muted">
                        {app.developer} · {rating(app.rating)}★
                      </p>
                    </div>
                    <MiniChart
                      values={trends.get(app.id) ?? []}
                      label={`Revenue trend for ${app.title}`}
                      className="hidden h-8 w-24 shrink-0 sm:block"
                    />
                    <span className="w-16 shrink-0 text-right text-[13px] font-semibold tabular-nums">
                      {money(app.estRevenue)}
                    </span>
                  </div>
                ))}
              </div>

              <BarChart
                title="Revenue by category"
                bars={categories.map((c) => ({ label: c.label, value: c.value }))}
                format="money"
              />
            </div>
          </div>

          <dl className="grid gap-4 pt-4 sm:grid-cols-4">
            {[
              { label: "Apps tracked", value: total.toLocaleString() },
              { label: "Creatives on file", value: totals.creatives.toLocaleString() },
              { label: "Creator videos", value: totals.organicPosts.toLocaleString() },
              { label: "Onboarding screens", value: totals.flows.toLocaleString() },
            ].map((stat) => (
              <div key={stat.label} className="surface-card px-5 py-4">
                <dt className="text-[12px] text-ink-muted">{stat.label}</dt>
                <dd className="pt-1 text-[24px] font-semibold tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid gap-4 pt-16 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="surface-card surface-card-interactive p-5">
              <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent-ink">
                <NavIcon name={feature.icon} className="size-4" />
              </span>
              <h2 className="pt-3 text-[14.5px] font-semibold">{feature.title}</h2>
              <p className="pt-1.5 text-[13px] leading-relaxed text-ink-muted">{feature.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-3xl bg-panel p-10 text-center text-panel-ink">
          <h2 className="text-[30px] font-semibold tracking-tight">No plans, no upsell</h2>
          <p className="mx-auto max-w-xl pt-3 text-[15px] leading-relaxed text-panel-ink-muted">
            Every feature is open to everyone. Run it locally, point it at your own database, and use it
            as much as you like.
          </p>
          <Link
            href="/dashboard/apps"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-[14px] font-medium text-panel hover:bg-white"
          >
            Open the dashboard
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
