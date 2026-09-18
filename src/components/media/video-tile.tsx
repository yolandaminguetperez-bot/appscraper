"use client";

import { Film, Image as ImageIcon, Play } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A creative tile that actually plays. The poster carries the first frame so the
 * grid stays still until someone hovers; playback is muted and looped, which is
 * what every ad library does and what browsers allow without a user gesture.
 */
export function VideoTile({
  mediaUrl,
  thumbUrl,
  kind,
  overlay,
  badge,
  onOpen,
  className,
}: {
  mediaUrl?: string | null;
  thumbUrl?: string | null;
  kind?: string;
  overlay?: React.ReactNode;
  badge?: React.ReactNode;
  onOpen?: () => void;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const isVideo = Boolean(mediaUrl) && kind !== "image";

  const start = () => {
    const video = videoRef.current;
    if (!video) return;
    // A rejected play promise is normal (reduced motion, battery saver) — the
    // poster simply stays put, so there is nothing to recover from.
    void video
      .play()
      .then(() => setPlaying(true))
      .catch(() => {});
  };

  const stop = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setPlaying(false);
  };

  const Icon = isVideo ? Film : ImageIcon;

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
      aria-label={onOpen ? "Open creative" : undefined}
      className={cn(
        "group relative block w-full overflow-hidden rounded-xl bg-panel text-left text-panel-ink",
        className,
      )}
    >
      <span className="block aspect-[9/16] w-full">
        {isVideo ? (
          <video
            ref={videoRef}
            src={mediaUrl ?? undefined}
            poster={thumbUrl ?? undefined}
            muted
            loop
            playsInline
            preload="none"
            className="size-full object-cover"
          />
        ) : thumbUrl ? (
          // Sample media is served from /public; next/image would add no value here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center bg-panel-soft">
            <Icon className="size-5 opacity-40" />
          </span>
        )}
      </span>

      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel/90 via-panel/10 to-transparent" />

      <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-panel/70 px-2 py-0.5 text-[10.5px] text-panel-ink">
        <Icon className="size-3" />
        {isVideo ? "Video" : "Image"}
      </span>

      {badge && (
        <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-panel/70 px-2 py-0.5 text-[10.5px] text-panel-ink">
          {badge}
        </span>
      )}

      {isVideo && !playing && (
        <span className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid size-10 place-items-center rounded-full bg-panel/70 transition-transform group-hover:scale-110">
            <Play className="size-4 fill-current" />
          </span>
        </span>
      )}

      {overlay && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 block p-2.5">{overlay}</span>
      )}
    </button>
  );
}
