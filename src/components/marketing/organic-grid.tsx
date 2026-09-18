"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Heart, MessageCircle, Users } from "lucide-react";
import { AppIcon } from "@/components/ui/app-icon";
import { VideoTile } from "@/components/media/video-tile";
import { MediaLightbox } from "@/components/media/media-lightbox";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { compactNumber, daysAgo } from "@/lib/format";
import type { OrganicPost } from "@/lib/db/marketing-query";

type Post = OrganicPost & { appTitle: string; appCategory: string | null; appIconUrl?: string | null };

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

export function OrganicGrid({
  posts,
  favorites,
  columns = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
}: {
  posts: Post[];
  favorites: Set<string>;
  columns?: string;
}) {
  const [open, setOpen] = useState<Post | null>(null);

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center text-sm text-ink-muted">
        No creator videos match these filters.
      </div>
    );
  }

  return (
    <>
      <div className={columns}>
        {posts.map((post) => (
          <article
            key={post.id}
            className="surface-card surface-card-interactive flex flex-col overflow-hidden"
          >
            <VideoTile
              mediaUrl={post.mediaUrl}
              thumbUrl={post.thumbUrl}
              kind="video"
              badge={PLATFORM_LABEL[post.platform] ?? post.platform}
              className="rounded-none"
              overlay={
                <span className="block">
                  <span className="line-clamp-2 block text-[12px] font-medium leading-snug text-panel-ink">
                    {post.caption}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-panel-ink-muted">{post.author}</span>
                </span>
              }
              onOpen={() => setOpen(post)}
            />

            <div className="flex items-center gap-2 px-3 pb-2 pt-2.5">
              <AppIcon
                id={post.appId}
                title={post.appTitle}
                iconUrl={post.appIconUrl}
                className="size-6"
              />
              <Link
                href={`/dashboard/apps/${encodeURIComponent(post.appId)}`}
                className="min-w-0 flex-1 truncate text-[12.5px] font-medium hover:text-accent-ink"
              >
                {post.appTitle}
              </Link>
              <FavoriteButton kind="organic" refId={post.id} initial={favorites.has(post.id)} />
            </div>

            {/* Three metrics, not four: a fourth ran the numbers together and
                clipped the last one. Follower count lives in the lightbox. */}
            <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-line px-3 py-2 text-[11.5px] text-ink-muted">
              <div className="flex items-center gap-1.5">
                <Eye className="size-3 shrink-0" aria-hidden />
                <dt className="sr-only">Views</dt>
                <dd className="truncate font-medium tabular-nums text-ink">
                  {compactNumber(post.views)}
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="size-3 shrink-0" aria-hidden />
                <dt className="sr-only">Likes</dt>
                <dd className="truncate tabular-nums">{compactNumber(post.likes)}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="size-3 shrink-0" aria-hidden />
                <dt className="sr-only">Comments</dt>
                <dd className="truncate tabular-nums">{compactNumber(post.comments)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <MediaLightbox
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        mediaUrl={open?.mediaUrl}
        thumbUrl={open?.thumbUrl}
        title={open?.caption}
        body={open ? `${open.author} · ${open.platform} · posted ${daysAgo(open.postedAt)}` : null}
        meta={
          open ? (
            <dl className="grid grid-cols-2 gap-3 text-[12.5px]">
              <div>
                <dt className="flex items-center gap-1 text-ink-faint">
                  <Eye className="size-3" /> Views
                </dt>
                <dd className="font-medium tabular-nums">{compactNumber(open.views)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-ink-faint">
                  <Heart className="size-3" /> Likes
                </dt>
                <dd className="font-medium tabular-nums">{compactNumber(open.likes)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-ink-faint">
                  <MessageCircle className="size-3" /> Comments
                </dt>
                <dd className="font-medium tabular-nums">{compactNumber(open.comments)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-ink-faint">
                  <Users className="size-3" /> Followers
                </dt>
                <dd className="font-medium tabular-nums">{compactNumber(open.authorFollowers)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-ink-faint">App</dt>
                <dd className="font-medium">
                  <Link
                    href={`/dashboard/apps/${encodeURIComponent(open.appId)}`}
                    className="hover:text-accent-ink"
                  >
                    {open.appTitle}
                  </Link>
                </dd>
              </div>
            </dl>
          ) : null
        }
      />
    </>
  );
}
