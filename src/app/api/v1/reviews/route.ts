import { queryReviews, summarizeReviews } from "@/lib/db/reviews-query";
import { parseReviewFilters } from "@/lib/search-params";
import { json, paramsFrom } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { params } = paramsFrom(request);
  const filters = parseReviewFilters(params);
  const result = queryReviews(filters);
  return json({
    data: result.reviews,
    summary: summarizeReviews(filters),
    page: result.page,
    pages: result.pages,
    total: result.total,
  });
}
