import { getAppDetail } from "@/lib/db/app-detail";
import { countriesForApp, keywordRanksForApp } from "@/lib/db/aso-query";
import { json, notFound } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appId = decodeURIComponent(id);
  const detail = getAppDetail(appId);
  if (!detail) return notFound(`No app with id ${id}`);

  // Added to the documented shape rather than hidden behind an internal route:
  // where an app earns and what it ranks for is app data, not interface state.
  return json({
    data: { ...detail, markets: countriesForApp(appId), keywordRanks: keywordRanksForApp(appId) },
  });
}
