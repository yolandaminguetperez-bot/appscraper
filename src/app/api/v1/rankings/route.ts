import { queryRankings } from "@/lib/db/trends-query";
import { json, paramsFrom } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { url } = paramsFrom(request);
  const rows = queryRankings({
    store: url.searchParams.get("store") ?? "ios",
    chart: url.searchParams.get("chart") ?? "free",
    country: url.searchParams.get("country") ?? "us",
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return json({ data: rows, total: rows.length });
}
