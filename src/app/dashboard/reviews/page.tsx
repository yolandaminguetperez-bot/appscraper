import Link from "next/link";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ActiveChips } from "@/components/filters/active-chips";
import { ReviewsFilterBar } from "@/components/reviews/reviews-filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { queryReviews, ratingOverTime, summarizeReviews } from "@/lib/db/reviews-query";
import { TrendChart } from "@/components/charts/trend-chart";
import { daysAgo } from "@/lib/format";
import {
  describeReviewFilters,
  parseReviewFilters,
  toQueryString,
  type RawParams,
} from "@/lib/search-params";

export const dynamic = "force-dynamic";

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "bg-accent-soft text-accent-ink",
  neutral: "bg-surface-muted text-ink-muted",
  negative: "bg-[#fdeaea] text-[#a33131]",
};

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const filters = parseReviewFilters(params);
  const summary = summarizeReviews(filters);
  const result = queryReviews(filters);
  const chips = describeReviewFilters(params);
  const allTopics = summarizeReviews({}).topics.map((t) => t.topic);
  const ratingTrend = ratingOverTime(filters);

  const sentimentTotal =
    summary.sentiment.positive + summary.sentiment.neutral + summary.sentiment.negative || 1;

  return (
    <div className="pb-12">
      <PageHeader title="Review Analytics" subtitle="What users praise, and what they complain about." />
      <ReviewsFilterBar topics={allTopics} />
      <ActiveChips chips={chips} />

      <div className="grid gap-4 px-7 pt-4 lg:grid-cols-3">
        <section className="surface-card p-5">
          <h2 className="text-[15px] font-semibold">Rating mix</h2>
          <p className="pt-1 text-[28px] font-semibold tabular-nums">{summary.average.toFixed(2)}</p>
          <p className="text-[12.5px] text-ink-muted">{summary.total.toLocaleString()} reviews</p>
          <ul className="space-y-1.5 pt-3">
            {summary.distribution.map((row) => {
              const share = summary.total ? (row.count / summary.total) * 100 : 0;
              return (
                <li key={row.stars} className="flex items-center gap-2 text-[12.5px]">
                  <span className="w-3 text-ink-muted">{row.stars}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${share}%` }} />
                  </span>
                  <span className="w-10 text-right tabular-nums text-ink-muted">{row.count}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-[15px] font-semibold">Sentiment</h2>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-muted mt-4">
            <span
              className="block h-full bg-accent"
              style={{ width: `${(summary.sentiment.positive / sentimentTotal) * 100}%` }}
            />
            <span
              className="block h-full bg-ink-faint"
              style={{ width: `${(summary.sentiment.neutral / sentimentTotal) * 100}%` }}
            />
            <span
              className="block h-full bg-[#d4645f]"
              style={{ width: `${(summary.sentiment.negative / sentimentTotal) * 100}%` }}
            />
          </div>
          <ul className="space-y-1.5 pt-4 text-[13px]">
            {(["positive", "neutral", "negative"] as const).map((key) => (
              <li key={key} className="flex items-center justify-between">
                <span className="capitalize text-ink-muted">{key}</span>
                <span className="tabular-nums">
                  {summary.sentiment[key].toLocaleString()} (
                  {Math.round((summary.sentiment[key] / sentimentTotal) * 100)}%)
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-[15px] font-semibold">Topics</h2>
          <ul className="space-y-2 pt-3">
            {summary.topics.slice(0, 6).map((topic) => (
              <li key={topic.topic} className="flex items-center justify-between text-[13px]">
                <span className="capitalize">{topic.topic}</span>
                <span className="flex items-center gap-2 text-ink-muted">
                  <span className="tabular-nums">{topic.count}</span>
                  <span
                    className="rounded-full bg-surface-muted px-2 py-0.5 text-[11.5px] tabular-nums"
                    title="Share of mentions that are negative"
                  >
                    {Math.round(topic.negativeShare * 100)}% neg
                  </span>
                </span>
              </li>
            ))}
            {summary.topics.length === 0 && (
              <li className="text-[13px] text-ink-muted">No topics for this selection.</li>
            )}
          </ul>
        </section>
      </div>

      <div className="px-7 pt-4">
        <TrendChart
          title="Average rating over time"
          subtitle="Monthly mean of the reviews matching these filters."
          points={ratingTrend}
          format="rating"
          aggregate="average"
          scaleMax={5}
        />
      </div>

      <div className="px-7 pt-4">
        <div className="surface-card overflow-hidden">
          <ul>
            {result.reviews.map((review) => (
              <li key={review.id} className="border-b border-line px-5 py-4 last:border-0">
                <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-muted">
                  <span className="inline-flex items-center gap-1 text-ink">
                    <Star className="size-3.5 text-accent" />
                    {review.rating}
                  </span>
                  <Link
                    href={`/dashboard/apps/${encodeURIComponent(review.appId)}`}
                    className="font-medium text-ink hover:text-accent-ink"
                  >
                    {review.appTitle}
                  </Link>
                  <span>· {review.author}</span>
                  <span>· {daysAgo(review.postedAt)}</span>
                  {review.sentiment && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11.5px] capitalize ${
                        SENTIMENT_STYLES[review.sentiment] ?? ""
                      }`}
                    >
                      {review.sentiment}
                    </span>
                  )}
                  {review.topics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-surface-muted px-2 py-0.5 text-[11.5px] capitalize"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                <p className="pt-1.5 text-[13.5px] font-medium">{review.title}</p>
                <p className="text-[13px] text-ink-muted">{review.body}</p>
              </li>
            ))}
            {result.reviews.length === 0 && (
              <li className="px-5 py-12 text-center text-sm text-ink-muted">
                No reviews match these filters.
              </li>
            )}
          </ul>
        </div>

        <Pagination
          page={result.page}
          pages={result.pages}
          total={result.total}
          makeHref={(page) => `/dashboard/reviews?${toQueryString(params, { page: String(page) })}`}
        />
      </div>
    </div>
  );
}
