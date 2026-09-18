import { NextResponse } from "next/server";
import { queryApps } from "@/lib/db/app-query";
import { parseAppFilters, type RawParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "id", "store", "storeId", "title", "developer", "category", "price", "hasIap",
  "rating", "ratingCount", "estDownloads", "estMrr", "estRevenue", "releasedAt", "updatedAt", "storeUrl",
] as const;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: RawParams = {};
  for (const key of new Set(url.searchParams.keys())) {
    params[key] = url.searchParams.getAll(key);
  }

  // Export ignores pagination: the point is to take the whole filtered set.
  const filters = { ...parseAppFilters(params), page: 1, perPage: 200 };
  const rows: Record<string, unknown>[] = [];
  let page = 1;

  for (;;) {
    const result = queryApps({ ...filters, page });
    rows.push(...(result.apps as unknown as Record<string, unknown>[]));
    if (page >= result.pages || rows.length >= 10_000) break;
    page += 1;
  }

  const body = [
    COLUMNS.join(","),
    ...rows.map((row) => COLUMNS.map((col) => csvCell(row[col])).join(",")),
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="apps-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
