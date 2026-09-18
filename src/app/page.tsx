import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { countApps } from "@/lib/db/apps-repo";
import { compactNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const FEATURES = [
  { title: "App Store and Google Play data", body: "One catalogue, both stores, the same filters across every view." },
  { title: "Ads library", body: "Who is advertising, what they are running, and how long each creative has lived." },
  { title: "Creator videos", body: "Organic posts driving installs, sorted by views, likes or creator size." },
  { title: "Onboarding flows", body: "Screen-by-screen captures, filterable by the screen types you care about." },
  { title: "Store rankings", body: "Top free, paid and grossing by country, on both stores." },
  { title: "Review analytics", body: "Rating mix, sentiment split and the topics behind the complaints." },
  { title: "Keyword explorer", body: "Difficulty, a demand proxy, and the apps that own a term today." },
  { title: "API and MCP", body: "Every view is a query you can run from code or hand to an AI agent." },
];

export default async function LandingPage() {
  const total = countApps();

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
          href="/dashboard/apps"
          className="rounded-full bg-panel px-4 py-2 text-[13px] font-medium text-panel-ink hover:bg-panel-soft"
        >
          Open dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="pt-16 text-center">
          <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-[12.5px] font-medium text-accent-ink">
            Free · no account · no limits
          </span>
          <h1 className="mx-auto max-w-3xl pt-5 text-[46px] font-semibold leading-[1.08] tracking-tight">
            Everything that sells on the stores, and why it sells.
          </h1>
          <p className="mx-auto max-w-2xl pt-4 text-[17px] leading-relaxed text-ink-muted">
            Search {compactNumber(total)} apps, the ads they run, the creators posting about them and the
            onboarding flows they ship — then export it or query it from your own code.
          </p>
          <div className="flex items-center justify-center gap-3 pt-7">
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

        <section className="grid gap-4 pt-20 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="surface-card p-5">
              <Check className="size-4 text-accent" />
              <h2 className="pt-3 text-[14.5px] font-medium">{feature.title}</h2>
              <p className="pt-1 text-[13px] leading-relaxed text-ink-muted">{feature.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-20 rounded-3xl bg-panel p-10 text-center text-panel-ink">
          <h2 className="text-[28px] font-semibold tracking-tight">No plans, no upsell</h2>
          <p className="mx-auto max-w-xl pt-3 text-[15px] leading-relaxed text-panel-ink-muted">
            Every feature is open to everyone. Run it locally, point it at your own database, and use it
            as much as you like.
          </p>
          <Link
            href="/dashboard/apps"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-[14px] font-medium text-panel hover:bg-white"
          >
            Open the dashboard
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
