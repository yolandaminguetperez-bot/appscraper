"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteAlertAction } from "@/app/actions/alerts";

export function DeleteAlert({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => deleteAlertAction(id))}
      aria-label={`Delete alert: ${label}`}
      className="grid size-7 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-muted hover:text-neg disabled:opacity-50"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
