import { queryAdGroups, queryCreatives } from "@/lib/db/marketing-query";
import { parseAdFilters } from "@/lib/search-params";
import { json, paramsFrom } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { params, url } = paramsFrom(request);
  const filters = parseAdFilters(params);

  if (url.searchParams.get("view") === "ads") {
    const result = queryCreatives(filters);
    return json({ data: result.creatives, page: result.page, pages: result.pages, total: result.total });
  }

  const result = queryAdGroups(filters);
  return json({ data: result.groups, page: result.page, pages: result.pages, total: result.total });
}
