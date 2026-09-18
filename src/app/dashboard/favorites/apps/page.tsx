import { PageHeader } from "@/components/layout/page-header";
import { AppsTable } from "@/components/apps/apps-table";
import { favoriteApps, favoriteIds } from "@/lib/db/favorites";

export const dynamic = "force-dynamic";

export default async function FavoriteAppsPage() {
  const apps = favoriteApps();

  return (
    <div className="pb-12">
      <PageHeader title="Favorite apps" subtitle={`${apps.length} saved`} />
      <div className="px-7 pt-5">
        <AppsTable apps={apps} favorites={favoriteIds("app")} />
      </div>
    </div>
  );
}
