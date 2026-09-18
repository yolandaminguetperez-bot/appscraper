import { queryApps } from "@/lib/db/app-query";
import { parseAppFilters } from "@/lib/search-params";
import { json, paramsFrom } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { params } = paramsFrom(request);
  const result = queryApps(parseAppFilters(params));
  return json({
    data: result.apps,
    page: result.page,
    perPage: result.perPage,
    pages: result.pages,
    total: result.total,
  });
}
