import { NextResponse } from "next/server";
import { queryCreatives } from "@/lib/db/marketing-query";
import { parseAdFilters, type RawParams } from "@/lib/search-params";
import { collectPages, csvBody, csvHeaders, rawParamsFrom } from "@/lib/csv";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "id", "appId", "network", "kind", "headline", "body", "cta",
  "daysRunning", "firstSeen", "lastSeen", "countries", "landingUrl", "mediaUrl",
] as const;

export async function GET(request: Request) {
  const params = rawParamsFrom(new URL(request.url)) as RawParams;
  const filters = { ...parseAdFilters(params), perPage: 200 };

  const rows = collectPages((page) => {
    const result = queryCreatives({ ...filters, page });
    return { rows: result.creatives as unknown as Record<string, unknown>[], pages: result.pages };
  });

  return new NextResponse(csvBody(COLUMNS, rows), { headers: csvHeaders("ads") });
}
