import { queryOrganic } from "@/lib/db/marketing-query";
import { parseOrganicFilters } from "@/lib/search-params";
import { json, paramsFrom } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { params } = paramsFrom(request);
  const result = queryOrganic(parseOrganicFilters(params));
  return json({ data: result.posts, page: result.page, pages: result.pages, total: result.total });
}
