"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type Screen = {
  id: string;
  position: number;
  screenType: string | null;
  imageUrl: string | null;
};

/** A flow reads as a filmstrip; clicking a frame opens it big and walks the flow. */
export function ScreenStrip({ screens, title }: { screens: Screen[]; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : Math.min(screens.length - 1, i + 1)));
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : Math.max(0, i - 1)));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, screens.length]);

  const current = openIndex === null ? null : screens[openIndex];

  return (
    <>
      <ol className="scroll-thin flex gap-2.5 overflow-x-auto pb-2">
        {screens.map((screen, index) => (
          <li key={screen.id} className="w-[116px] shrink-0">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Open screen ${index + 1}, ${screen.screenType ?? "screen"}`}
              className="group block w-full text-left"
            >
              <span className="relative block overflow-hidden rounded-xl border border-panel-line bg-panel">
                {screen.imageUrl ? (
                  // Generated wireframes served from /public; next/image adds nothing here.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={screen.imageUrl}
                    alt={`${screen.screenType ?? "Screen"} ${index + 1}`}
                    loading="lazy"
                    className="block aspect-[15/32] w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="grid aspect-[15/32] w-full place-items-center text-[11px] text-panel-ink-muted">
                    {screen.screenType}
                  </span>
                )}
                <span className="absolute left-1.5 top-1.5 rounded-full bg-panel/75 px-1.5 py-0.5 text-[10px] text-panel-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </span>
              <span className="mt-1 block truncate text-[11.5px] text-ink-muted">
                {screen.screenType}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {current && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title}, screen ${openIndex + 1} of ${screens.length}`}
          className="fixed inset-0 z-[60] grid place-items-center bg-panel/85 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpenIndex(Math.max(0, openIndex - 1))}
              disabled={openIndex === 0}
              aria-label="Previous screen"
              className={cn(
                "grid size-10 place-items-center rounded-full bg-surface text-ink-muted hover:text-ink",
                openIndex === 0 && "opacity-40",
              )}
            >
              <ChevronLeft className="size-5" />
            </button>

            <figure className="text-center">
              {current.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.imageUrl}
                  alt={`${current.screenType ?? "Screen"} ${openIndex + 1}`}
                  className="max-h-[72dvh] rounded-2xl border border-panel-line"
                />
              )}
              <figcaption className="pt-3 text-[13px] text-panel-ink">
                {current.screenType} · screen {openIndex + 1} of {screens.length}
              </figcaption>
            </figure>

            <button
              type="button"
              onClick={() => setOpenIndex(Math.min(screens.length - 1, openIndex + 1))}
              disabled={openIndex === screens.length - 1}
              aria-label="Next screen"
              className={cn(
                "grid size-10 place-items-center rounded-full bg-surface text-ink-muted hover:text-ink",
                openIndex === screens.length - 1 && "opacity-40",
              )}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Close"
            className="fixed right-4 top-4 grid size-10 place-items-center rounded-full bg-surface text-ink-muted hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </>
  );
}
