import Link from "next/link";
import { Eye, Heart, MessageCircle, Play } from "lucide-react";
import { compactNumber, daysAgo } from "@/lib/format";
import type { OrganicPost } from "@/lib/db/marketing-query";
import { FavoriteButton } from "@/components/ui/favorite-button";

type Post = OrganicPost & { appTitle: string; appCategory: string | null };

export function OrganicGrid({ posts, favorites }: { posts: Post[]; favorites: Set<string> }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-12 text-center text-sm text-ink-muted">
        No creator videos match these filters.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {posts.map((post) => (
        <article key={post.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="relative flex aspect-[9/14] flex-col justify-end bg-panel p-3 text-panel-ink">
            <Play className="absolute left-3 top-3 size-4 opacity-40" />
            <p className="line-clamp-3 text-[12.5px] leading-snug">{post.caption}</p>
            <p className="mt-1.5 text-[11px] text-panel-ink-muted">{post.author}</p>
          </div>
          <div className="space-y-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/dashboard/apps/${encodeURIComponent(post.appId)}`}
                className="block truncate text-[13px] font-medium hover:text-accent-ink"
              >
                {post.appTitle}
              </Link>
              <FavoriteButton kind="organic" refId={post.id} initial={favorites.has(post.id)} />
            </div>
            <div className="flex items-center gap-3 text-[11.5px] text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" />
                {compactNumber(post.views)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3" />
                {compactNumber(post.likes)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3" />
                {compactNumber(post.comments)}
              </span>
            </div>
            <p className="text-[11px] text-ink-faint">
              {post.platform} · {daysAgo(post.postedAt)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
