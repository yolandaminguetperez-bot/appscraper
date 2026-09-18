import { PageHeader } from "@/components/layout/page-header";
import { OrganicGrid } from "@/components/marketing/organic-grid";
import { favoriteIds, favoriteOrganic } from "@/lib/db/favorites";

export const dynamic = "force-dynamic";

export default async function FavoriteOrganicPage() {
  const posts = favoriteOrganic().map((row) => ({
    id: row.id as string,
    appId: row.app_id as string,
    platform: row.platform as string,
    author: (row.author as string) ?? null,
    authorFollowers: (row.author_followers as number) ?? null,
    caption: (row.caption as string) ?? null,
    postUrl: null,
    thumbUrl: (row.thumb_url as string) ?? null,
    mediaUrl: (row.media_url as string) ?? null,
    views: (row.views as number) ?? null,
    likes: (row.likes as number) ?? null,
    comments: (row.comments as number) ?? null,
    postedAt: (row.posted_at as string) ?? null,
    appTitle: row.app_title as string,
    appCategory: (row.app_category as string) ?? null,
  }));

  return (
    <div className="pb-12">
      <PageHeader title="Favorite organic" subtitle={`${posts.length} saved`} />
      <div className="px-7 pt-5">
        <OrganicGrid posts={posts} favorites={favoriteIds("organic")} />
      </div>
    </div>
  );
}
