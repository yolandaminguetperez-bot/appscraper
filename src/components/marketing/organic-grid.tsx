"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Heart, MessageCircle, Users } from "lucide-react";
import { VideoTile } from "@/components/media/video-tile";
import { MediaLightbox } from "@/components/media/media-lightbox";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { compactNumber, daysAgo } from "@/lib/format";
import type { OrganicPost } from "@/lib/db/marketing-query";

type Post = OrganicPost & { appTitle: string; appCategory: string | null };

export function OrganicGrid({ posts, favorites }: { posts: Post[]; favorites: Set<string> }) {
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {posts.map((post) => (
          <div key={post.id} className="space-y-1.5">
            <VideoTile
              mediaUrl={post.mediaUrl}
              thumbUrl={post.thumbUrl}
              kind="video"
              badge={`${compactNumber(post.views)} views`}
              overlay={
                <span className="block">
                  <span className="line-clamp-2 block text-[11.5px] leading-snug text-panel-ink">
                    {post.caption}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-panel-ink-muted">{post.author}</span>
                </span>
              }
              onOpen={() => setOpen(post)}
            />
            <div className="flex items-center justify-between gap-2 px-0.5">
              <Link
                href={`/dashboard/apps/${encodeURIComponent(post.appId)}`}
                className="min-w-0 truncate text-[12.5px] font-medium hover:text-accent-ink"
              >
                {post.appTitle}
              </Link>
              <FavoriteButton kind="organic" refId={post.id} initial={favorites.has(post.id)} />
            </div>
          </div>
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
