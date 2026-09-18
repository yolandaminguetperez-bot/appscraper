import { refreshFromStores } from "@/lib/sources/refresh";
import { json, paramsFrom } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const { url } = paramsFrom(request);
  const result = await refreshFromStores({
    term: url.searchParams.get("term") ?? undefined,
    country: url.searchParams.get("country") ?? "us",
    charts: url.searchParams.get("charts") !== "false",
  });

  const failed = result.outcomes.filter((o) => o.error);
  // A refresh that imported nothing and failed everywhere is a failure, not a no-op.
  const status = result.imported === 0 && failed.length > 0 ? 502 : 200;

  return json(
    {
      imported: result.imported,
      outcomes: result.outcomes,
      ...(status === 502
        ? {
            error:
              "Could not reach the stores. Check that itunes.apple.com, rss.applemarketingtools.com and play.google.com are reachable from this host.",
          }
        : {}),
    },
    { status },
  );
}
