import { NextResponse } from "next/server";
import { queryApps } from "@/lib/db/app-query";
import { parseAppFilters, type RawParams } from "@/lib/search-params";
import { collectPages, csvBody, csvHeaders, rawParamsFrom } from "@/lib/csv";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "id", "store", "storeId", "title", "developer", "category", "price", "hasIap",
  "rating", "ratingCount", "estDownloads", "estMrr", "estRevenue", "releasedAt", "updatedAt", "storeUrl",
] as const;

export async function GET(request: Request) {
  const params = rawParamsFrom(new URL(request.url)) as RawParams;
  const filters = { ...parseAppFilters(params), perPage: 200 };

  const rows = collectPages((page) => {
    const result = queryApps({ ...filters, page });
    return { rows: result.apps as unknown as Record<string, unknown>[], pages: result.pages };
  });

  return new NextResponse(csvBody(COLUMNS, rows), { headers: csvHeaders("apps") });
}
