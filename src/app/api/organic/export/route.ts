import { NextResponse } from "next/server";
import { queryOrganic } from "@/lib/db/marketing-query";
import { parseOrganicFilters, type RawParams } from "@/lib/search-params";
import { collectPages, csvBody, csvHeaders, rawParamsFrom } from "@/lib/csv";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "id", "appId", "platform", "author", "authorFollowers", "caption",
  "views", "likes", "comments", "postedAt", "postUrl",
] as const;

export async function GET(request: Request) {
  const params = rawParamsFrom(new URL(request.url)) as RawParams;
  const filters = { ...parseOrganicFilters(params), perPage: 200 };

  const rows = collectPages((page) => {
    const result = queryOrganic({ ...filters, page });
    return { rows: result.posts as unknown as Record<string, unknown>[], pages: result.pages };
  });

  return new NextResponse(csvBody(COLUMNS, rows), { headers: csvHeaders("organic") });
}
