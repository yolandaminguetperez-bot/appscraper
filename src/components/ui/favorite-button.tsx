"use client";

import { usePathname } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toggleFavoriteAction } from "@/app/actions/favorites";
import type { FavoriteKind } from "@/lib/db/favorites";
import { cn } from "@/lib/cn";
import { SpriteIcon, SPRITE_IDS } from "@/components/ui/icon-sprite";

export function FavoriteButton({
  kind,
  refId,
  initial,
  className,
}: {
  kind: FavoriteKind;
  refId: string;
  initial: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useOptimistic(initial);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from favorites" : "Save to favorites"}
      onClick={() =>
        startTransition(async () => {
          setSaved(!saved);
          await toggleFavoriteAction(kind, refId, pathname);
        })
      }
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full transition-colors",
        saved ? "text-accent" : "text-ink-faint hover:text-ink",
        className,
      )}
    >
      <SpriteIcon id={saved ? SPRITE_IDS.heartFilled : SPRITE_IDS.heart} className="size-4" />
    </button>
  );
}
