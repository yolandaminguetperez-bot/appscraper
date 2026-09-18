import { keywordStats, suggestedKeywords } from "@/lib/db/keywords-query";
import { badRequest, json, paramsFrom } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { url } = paramsFrom(request);
  const term = url.searchParams.get("term")?.trim();
  if (!term) {
    return json({ data: suggestedKeywords(Number(url.searchParams.get("limit") ?? 24)) });
  }
  if (term.length < 2) return badRequest("term must be at least 2 characters");
  return json({ data: keywordStats(term) });
}
