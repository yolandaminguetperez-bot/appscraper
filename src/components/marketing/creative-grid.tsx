"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock3, Globe2 } from "lucide-react";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { VideoTile } from "@/components/media/video-tile";
import { MediaLightbox } from "@/components/media/media-lightbox";
import type { Creative } from "@/lib/db/marketing-query";
import { daysAgo } from "@/lib/format";

export type CreativeWithApp = Creative & { appTitle?: string; appDeveloper?: string | null };

function Meta({ creative }: { creative: CreativeWithApp }) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-[12.5px]">
      <div>
        <dt className="text-ink-faint">Running</dt>
        <dd className="font-medium">{creative.daysRunning ?? 0} days</dd>
      </div>
      <div>
        <dt className="text-ink-faint">Last seen</dt>
        <dd className="font-medium">{daysAgo(creative.lastSeen)}</dd>
      </div>
      <div>
        <dt className="text-ink-faint">Format</dt>
        <dd className="font-medium capitalize">{creative.kind}</dd>
      </div>
      <div>
        <dt className="text-ink-faint">Countries</dt>
        <dd className="font-medium">{creative.countries.join(", ").toUpperCase() || "—"}</dd>
      </div>
      {creative.cta && (
        <div className="col-span-2">
          <dt className="text-ink-faint">Call to action</dt>
          <dd className="font-medium">{creative.cta}</dd>
        </div>
      )}
    </dl>
  );
}

/** Ad copy sits over the video in the DOM, not burned into the frame. */
function CopyOverlay({ creative }: { creative: CreativeWithApp }) {
  return (
    <span className="block">
      <span className="line-clamp-2 block text-[11.5px] font-medium leading-snug text-panel-ink">
        {creative.headline}
      </span>
      {creative.cta && (
        <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-panel">
          {creative.cta}
        </span>
      )}
    </span>
  );
}

/**
 * Props stay serializable on purpose: this is a client component, so a render
 * prop from a server component would fail at request time rather than at build.
 */
export function CreativeGrid({
  creatives,
  columns = "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6",
  footer = "none",
  savedIds,
}: {
  creatives: CreativeWithApp[];
  columns?: string;
  footer?: "none" | "app";
  savedIds?: string[];
}) {
  const saved = new Set(savedIds ?? []);
  const [open, setOpen] = useState<CreativeWithApp | null>(null);

  return (
    <>
      <div className={columns}>
        {creatives.map((creative) => (
          <div key={creative.id} className="space-y-1.5">
            <VideoTile
              mediaUrl={creative.mediaUrl}
              thumbUrl={creative.thumbUrl}
              kind={creative.kind}
              badge={`${creative.daysRunning ?? 0}d`}
              overlay={<CopyOverlay creative={creative} />}
              onOpen={() => setOpen(creative)}
            />
            {footer === "app" && (
              <div className="flex items-center justify-between gap-2 px-0.5">
                <Link
                  href={`/dashboard/apps/${encodeURIComponent(creative.appId)}`}
                  className="min-w-0 truncate text-[12.5px] font-medium hover:text-accent-ink"
                >
                  {creative.appTitle}
                </Link>
                <FavoriteButton kind="ad" refId={creative.id} initial={saved.has(creative.id)} />
              </div>
            )}
          </div>
        ))}
      </div>

      <MediaLightbox
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        mediaUrl={open?.mediaUrl}
        thumbUrl={open?.thumbUrl}
        title={open?.headline ?? open?.appTitle}
        body={open?.body}
        meta={
          open ? (
            <div className="space-y-3">
              {open.appTitle && (
                <p className="text-[13px] text-ink-muted">
                  {open.appTitle}
                  {open.appDeveloper ? ` · ${open.appDeveloper}` : ""}
                </p>
              )}
              <Meta creative={open} />
              <p className="flex items-center gap-3 text-[11.5px] text-ink-faint">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3" />
                  first seen {daysAgo(open.firstSeen)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Globe2 className="size-3" />
                  {open.countries.join(", ").toUpperCase() || "—"}
                </span>
              </p>
            </div>
          ) : null
        }
      />
    </>
  );
}
