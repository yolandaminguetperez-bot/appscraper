"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

/** Full-size playback with real controls, for when the hover preview is not enough. */
export function MediaLightbox({
  open,
  onClose,
  mediaUrl,
  thumbUrl,
  title,
  body,
  meta,
}: {
  open: boolean;
  onClose: () => void;
  mediaUrl?: string | null;
  thumbUrl?: string | null;
  title?: string | null;
  body?: string | null;
  meta?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Creative"}
      className="fixed inset-0 z-[60] grid place-items-center bg-panel/80 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-2xl bg-surface p-4 sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full shrink-0 overflow-hidden rounded-xl bg-panel sm:w-[280px]">
          {mediaUrl ? (
            <video
              src={mediaUrl}
              poster={thumbUrl ?? undefined}
              controls
              autoPlay
              muted
              loop
              playsInline
              className="aspect-[9/16] w-full object-cover"
            />
          ) : thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbUrl} alt="" className="aspect-[9/16] w-full object-cover" />
          ) : (
            <div className="grid aspect-[9/16] w-full place-items-center text-[13px] text-panel-ink-muted">
              No media on file
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[16px] font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
          {body && <p className="pt-2 text-[13.5px] leading-relaxed text-ink-muted">{body}</p>}
          {meta && <div className="pt-4">{meta}</div>}
        </div>
      </div>
    </div>
  );
}
