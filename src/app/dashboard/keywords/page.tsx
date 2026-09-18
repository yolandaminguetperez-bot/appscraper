import Link from "next/link";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KeywordSearch } from "@/components/keywords/keyword-search";
import { AppIcon } from "@/components/ui/app-icon";
import { difficultyBand, keywordStats, relatedKeywords, suggestedKeywords } from "@/lib/db/keywords-query";
import { compactNumber, money, rating } from "@/lib/format";
import type { RawParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

function Meter({
  label,
  value,
  hint,
  band,
}: {
  label: string;
  value: number;
  hint: string;
  /** The word for the number; a bare 0-100 score means nothing on its own. */
  band?: string;
}) {
  return (
    <div className="surface-card p-5">
      <p className="text-[13px] text-ink-muted">{label}</p>
      <p className="flex items-baseline gap-2 pt-1">
        <span className="text-[28px] font-semibold tabular-nums">{value}</span>
        {band ? (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-accent-ink">
            {band}
          </span>
        ) : null}
      </p>
      <span className="mt-2 block h-2 overflow-hidden rounded-full bg-surface-muted">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </span>
      <p className="pt-2 text-[11.5px] text-ink-faint">{hint}</p>
    </div>
  );
}

export default async function KeywordsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const raw = params.term;
  const term = ((Array.isArray(raw) ? raw[0] : raw) ?? "").trim();
  const suggestions = suggestedKeywords(18);
  const stats = term ? keywordStats(term) : null;
  const related = term ? relatedKeywords(term) : [];

  return (
    <div className="pb-12">
      <PageHeader title="Keyword Explorer" subtitle="How crowded a term is, and who owns it today." />
      <KeywordSearch initial={term} suggestions={suggestions.map((s) => s.term)} />

      {!stats ? (
        <div className="px-7 pt-6">
          <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center text-sm text-ink-muted">
            Search a term, or pick one of the suggestions above.
          </div>
        </div>
      ) : (
        <div className="space-y-4 px-7 pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Meter
              label="Difficulty"
              value={stats.difficulty}
              band={difficultyBand(stats.difficulty)}
              hint="From the review mass of apps already ranking."
            />
            <Meter
              label="Volume index"
              value={stats.volumeIndex}
              hint="Relative demand proxy — compare terms, not absolutes."
            />
            <div className="surface-card p-5">
              <p className="text-[13px] text-ink-muted">Competing apps</p>
              <p className="pt-1 text-[28px] font-semibold tabular-nums">
                {stats.competingApps.toLocaleString()}
              </p>
              <p className="pt-2 text-[11.5px] text-ink-faint">
                Apps in the catalogue mentioning “{stats.term}”.
              </p>
            </div>
          </div>

          {related.length > 0 && (
            <section className="surface-card overflow-hidden">
              <div className="border-b border-line px-5 py-3">
                <h2 className="text-[15px] font-semibold">Terms used alongside it</h2>
                <p className="pt-0.5 text-[12px] text-ink-muted">
                  Scored within the apps competing for “{stats.term}”, so it answers whether
                  a narrower corner is easier — not how the term does catalogue-wide.
                </p>
              </div>
              <ul className="divide-y divide-line">
                {related.map((item) => (
                  <li key={item.term} className="flex items-center gap-4 px-5 py-2.5">
                    <Link
                      href={`/dashboard/keywords?term=${encodeURIComponent(item.term)}`}
                      className="min-w-0 flex-1 truncate text-[14px] font-medium hover:text-accent-ink"
                    >
                      {item.term}
                    </Link>
                    <span className="w-24 text-right text-[13px] tabular-nums text-ink-muted">
                      {item.apps} apps
                    </span>
                    <span className="hidden w-40 items-center gap-2 sm:flex" aria-hidden>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                        <span
                          className="block h-full rounded-full bg-accent"
                          style={{ width: `${item.difficulty}%` }}
                        />
                      </span>
                    </span>
                    <span className="w-24 text-right text-[13px] tabular-nums">
                      {item.difficulty}
                      <span className="pl-1.5 text-[11.5px] text-ink-faint">
                        {difficultyBand(item.difficulty)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="surface-card overflow-hidden">
            <h2 className="border-b border-line px-5 py-3 text-[15px] font-semibold">
              Apps ranking for “{stats.term}”
            </h2>
            <ol>
              {stats.topApps.map((app, index) => (
                <li
                  key={app.id}
                  className="flex items-center gap-4 border-b border-line px-5 py-3 last:border-0"
                >
                  <span className="w-6 text-right text-[13px] tabular-nums text-ink-faint">
                    {index + 1}
                  </span>
                  <AppIcon id={app.id} title={app.title} iconUrl={app.iconUrl} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/apps/${encodeURIComponent(app.id)}`}
                      className="block truncate text-[14px] font-medium hover:text-accent-ink"
                    >
                      {app.title}
                    </Link>
                    <span className="block truncate text-[12px] text-ink-muted">
                      {app.developer} · {app.category}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[13px]">
                    <Star className="size-3.5 text-accent" />
                    {rating(app.rating)}
                  </span>
                  <span className="w-20 text-right text-[13px] tabular-nums text-ink-muted">
                    {compactNumber(app.ratingCount)} reviews
                  </span>
                  <span className="w-16 text-right text-[13px] tabular-nums">{money(app.estMrr)}</span>
                </li>
              ))}
              {stats.topApps.length === 0 && (
                <li className="px-5 py-10 text-center text-sm text-ink-muted">
                  Nothing in the catalogue targets this term yet.
                </li>
              )}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
