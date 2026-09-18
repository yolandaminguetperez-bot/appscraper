"use client";

import { useEffect } from "react";
import { useQuickLook } from "@/components/quicklook/quick-look-provider";

/**
 * Keyboard navigation for a results table.
 *
 * j/k move the highlight, Enter opens the app, Space opens the quick look and
 * s selects it for comparison. The arrow keys do the same as j/k, because
 * nobody should have to know vi to move down a list.
 *
 * The highlight is a class on the row rather than focus: focusing the row would
 * pull focus away from the links inside it and make Tab behave differently.
 */
export function TableKeys() {
  const { open, openId } = useQuickLook();

  useEffect(() => {
    const rows = () => [...document.querySelectorAll<HTMLTableRowElement>("tbody tr[data-app-id]")];

    function current(): number {
      return rows().findIndex((row) => row.dataset.active === "true");
    }

    function highlight(index: number) {
      const all = rows();
      if (all.length === 0) return;
      const next = Math.max(0, Math.min(all.length - 1, index));
      for (const row of all) delete row.dataset.active;
      all[next].dataset.active = "true";
      all[next].scrollIntoView({ block: "nearest" });
    }

    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      // Never steal a keystroke from something being typed into.
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (openId) return;

      const index = current();

      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        highlight(index === -1 ? 0 : index + 1);
      } else if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        highlight(index === -1 ? 0 : index - 1);
      } else if (index >= 0 && (event.key === "Enter" || event.key === " " || event.key === "s")) {
        const row = rows()[index];
        const id = row.dataset.appId;
        if (!id) return;
        event.preventDefault();
        if (event.key === "Enter") row.querySelector<HTMLAnchorElement>("a[href^='/dashboard/apps/']")?.click();
        else if (event.key === " ") open(id);
        else row.querySelector<HTMLButtonElement>("[role=checkbox]")?.click();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openId]);

  return null;
}
