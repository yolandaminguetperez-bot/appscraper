"use client";

import { useRef, useState, useTransition } from "react";
import { setTrackedNoteAction } from "@/app/actions/tracking";

/**
 * Why this app is being watched, in the user's own words.
 *
 * Saves on blur rather than behind a button: a note nobody presses save on is a
 * note that gets lost, and there is nothing here worth a confirmation step.
 */
export function TrackedNote({ appId, initial }: { appId: string; initial: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const saved = useRef(initial ?? "");
  const [pending, start] = useTransition();

  return (
    <label className="block pt-3">
      <span className="sr-only">Note</span>
      <textarea
        rows={2}
        value={value}
        maxLength={280}
        placeholder="Why are you watching this app?"
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          if (value === saved.current) return;
          saved.current = value;
          start(async () => setTrackedNoteAction(appId, value));
        }}
        className="w-full resize-none rounded-xl border border-line bg-surface-muted/40 px-3 py-2 text-[12.5px] leading-relaxed text-ink placeholder:text-ink-faint focus:bg-surface"
      />
      <span className="block pt-1 text-[11px] text-ink-faint">
        {pending ? "Saving…" : value ? `${value.length}/280` : "Saved when you click away"}
      </span>
    </label>
  );
}
