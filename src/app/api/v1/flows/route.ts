import { queryFlows } from "@/lib/db/flows-query";
import { parseFlowFilters } from "@/lib/search-params";
import { json, paramsFrom } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { params } = paramsFrom(request);
  const result = queryFlows(parseFlowFilters(params));
  return json({ data: result.flows, page: result.page, pages: result.pages, total: result.total });
}
