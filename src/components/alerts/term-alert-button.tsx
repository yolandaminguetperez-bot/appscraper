"use client";

import { Bell, BellRing } from "lucide-react";
import { useState, useTransition } from "react";
import { createAlertAction } from "@/app/actions/alerts";
import { cn } from "@/lib/cn";

/**
 * Watches one search term for this app.
 *
 * Positions are watched in places, not percent: dropping from 4 to 8 is the
 * same 4 places as 40 to 44 but a percentage would call the first a catastrophe
 * and the second a rounding error, when it is the reverse.
 */
export function TermAlertButton({
  appId,
  term,
  alreadySet,
}: {
  appId: string;
  term: string;
  alreadySet: boolean;
}) {
  const [saved, setSaved] = useState(alreadySet);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending || saved}
      title={saved ? `Alerting on “${term}”` : `Alert me if “${term}” moves 5 places`}
      aria-label={saved ? `Alert set for ${term}` : `Alert me about ${term}`}
      onClick={() =>
        start(async () => {
          await createAlertAction({
            appId,
            metric: "position",
            direction: "down",
            threshold: 5,
            term,
          });
          setSaved(true);
        })
      }
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full transition-colors disabled:cursor-default",
        saved ? "text-accent-ink" : "text-ink-faint hover:bg-surface-muted hover:text-ink",
      )}
    >
      {saved ? <BellRing className="size-3.5" /> : <Bell className="size-3.5" />}
    </button>
  );
}
