import { cn } from "@/lib/cn";

/** A real store icon when we have one, a deterministic generated mark when we do not. */
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
  const src = iconUrl ?? `/api/icon/${encodeURIComponent(id)}`;

  return (
    // Remote store icons come from arbitrary CDNs; next/image would need each one
    // allow-listed, and these render at 24-56px where optimization buys nothing.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${title} icon`}
      loading="lazy"
      className={cn("shrink-0 rounded-[22%] bg-surface-muted object-cover", className)}
    />
  );
}
