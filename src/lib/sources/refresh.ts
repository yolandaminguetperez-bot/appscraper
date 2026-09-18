import { upsertApps } from "@/lib/db/apps-repo";
import { appStoreChart, searchAppStore } from "@/lib/sources/app-store";
import { playChart, searchGooglePlay } from "@/lib/sources/google-play";
import type { App } from "@/lib/types";

export type RefreshOutcome = {
  source: string;
  imported: number;
  error?: string;
};

/**
 * Pulls fresh listings from the stores. Each source is isolated: one blocked or
 * rate-limited store must not cost us the data another one returned.
 */
export async function refreshFromStores({
  term,
  country = "us",
  charts = true,
}: {
  term?: string;
  country?: string;
  charts?: boolean;
} = {}): Promise<{ outcomes: RefreshOutcome[]; imported: number }> {
  const jobs: { source: string; run: () => Promise<App[]> }[] = [];

  if (term) {
    jobs.push({ source: `App Store search “${term}”`, run: () => searchAppStore(term, { country }) });
    jobs.push({ source: `Google Play search “${term}”`, run: () => searchGooglePlay(term, { country }) });
  }
  if (charts) {
    for (const chart of ["free", "paid", "grossing"] as const) {
      jobs.push({
        source: `App Store top ${chart} (${country})`,
        run: () => appStoreChart({ chart, country, limit: 50 }),
      });
      jobs.push({
        source: `Google Play top ${chart} (${country})`,
        run: () => playChart({ chart, country, limit: 30 }),
      });
    }
  }

  const outcomes: RefreshOutcome[] = [];
  let imported = 0;

  for (const job of jobs) {
    try {
      const apps = await job.run();
      upsertApps(apps);
      imported += apps.length;
      outcomes.push({ source: job.source, imported: apps.length });
    } catch (error) {
      outcomes.push({
        source: job.source,
        imported: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { outcomes, imported };
}
