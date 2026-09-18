"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The app's own store artwork whenever we have it.
 *
 * The generated mark is a fallback for two cases and nothing else: a row whose
 * icon_url we have not fetched yet, and an icon_url that fails to load (the CDN
 * is unreachable, the artwork moved, the app was pulled). Without the onError
 * arm the second case renders a broken image, which is worse than a placeholder
 * and looks like a bug in the page.
 */
export function AppIcon({
  id,
  title,
  iconUrl,
  className,
}: {
  id: string;
  title: string;
  iconUrl?: string | null;
  className?: string;
}) {
  const generated = `/api/icon/${encodeURIComponent(id)}`;
  const [src, setSrc] = useState(iconUrl || generated);
  const isGenerated = src === generated;

  return (
    // Remote store icons come from arbitrary CDNs; next/image would need each one
    // allow-listed, and these render at 24-56px where optimization buys nothing.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${title} icon`}
      // Says what it is on hover, so a generated mark is never mistaken for the
      // app's real artwork failing to load.
      title={isGenerated ? `${title} — generated mark, no store artwork on file` : undefined}
      loading="lazy"
      // Intrinsic size, so the row keeps its shape while the image is still
      // loading and does not collapse if the stylesheet is missing.
      width={36}
      height={36}
      onError={() => {
        if (src !== generated) setSrc(generated);
      }}
      className={cn("shrink-0 rounded-[22%] bg-surface-muted object-cover", className)}
    />
  );
}
