import { NextResponse } from "next/server";
import { queryReviews } from "@/lib/db/reviews-query";
import { parseReviewFilters, type RawParams } from "@/lib/search-params";
import { collectPages, csvBody, csvHeaders, rawParamsFrom } from "@/lib/csv";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "id", "appId", "appTitle", "author", "rating", "title", "body",
  "postedAt", "sentiment", "topics",
] as const;

export async function GET(request: Request) {
  const params = rawParamsFrom(new URL(request.url)) as RawParams;
  const filters = { ...parseReviewFilters(params), perPage: 200 };

  const rows = collectPages((page) => {
    const result = queryReviews({ ...filters, page });
    return { rows: result.reviews as unknown as Record<string, unknown>[], pages: result.pages };
  });

  return new NextResponse(csvBody(COLUMNS, rows), { headers: csvHeaders("reviews") });
}
