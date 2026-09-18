import { PageHeader } from "@/components/layout/page-header";
import { AppsGrid } from "@/components/apps/apps-grid";
import Link from "next/link";
import { favoriteApps, favoriteIds } from "@/lib/db/favorites";
import { metricsForApps } from "@/lib/db/app-query";

export const dynamic = "force-dynamic";

export default async function FavoriteAppsPage() {
  const apps = favoriteApps();

  return (
    <div className="pb-12">
      <PageHeader title="Favorite apps" subtitle={`${apps.length} saved`} />
      <div className="px-7 pt-5">
        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface/70 px-6 py-14 text-center">
            <p className="text-[15px] font-medium">Nothing saved yet</p>
            <p className="mx-auto max-w-sm pt-1.5 text-[13px] leading-relaxed text-ink-muted">
              Tap the heart on any app and it lands here, so a shortlist survives the next search.
            </p>
            <Link
              href="/dashboard/apps"
              className="mt-5 inline-flex rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-panel hover:bg-accent-ink hover:text-white"
            >
              Browse apps
            </Link>
          </div>
        ) : (
          <AppsGrid
            apps={apps}
            favorites={favoriteIds("app")}
            trends={metricsForApps(apps.map((app) => app.id))}
          />
        )}
      </div>
    </div>
  );
}
