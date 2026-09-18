import { PageHeader } from "@/components/layout/page-header";
import { CreativeCards } from "@/components/marketing/ad-cards";
import { favoriteCreatives } from "@/lib/db/favorites";

export const dynamic = "force-dynamic";

export default async function FavoriteAdsPage() {
  const rows = favoriteCreatives();

  const creatives = rows.map((row) => ({
    id: row.id as string,
    appId: row.app_id as string,
    network: row.network as string,
    kind: row.kind as string,
    headline: (row.headline as string) ?? null,
    body: (row.body as string) ?? null,
    cta: (row.cta as string) ?? null,
    mediaUrl: (row.media_url as string) ?? null,
    thumbUrl: (row.thumb_url as string) ?? null,
    landingUrl: null,
    firstSeen: (row.first_seen as string) ?? null,
    lastSeen: (row.last_seen as string) ?? null,
    daysRunning: (row.days_running as number) ?? null,
    countries: [] as string[],
    appTitle: row.app_title as string,
    appDeveloper: (row.app_developer as string) ?? null,
  }));

  return (
    <div className="pb-12">
      <PageHeader title="Favorite ads" subtitle={`${creatives.length} saved`} />
      <div className="px-7 pt-5">
        {creatives.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center text-sm text-ink-muted">
            Nothing saved yet — tap the heart on any creative.
          </div>
        ) : (
          <CreativeCards creatives={creatives} savedIds={new Set(creatives.map((c) => c.id))} />
        )}
      </div>
    </div>
  );
}
