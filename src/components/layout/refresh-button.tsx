"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

type State = { status: "idle" | "running" | "done" | "error"; message?: string };

export function RefreshButton() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "idle" });

  const run = async () => {
    setState({ status: "running" });
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: body.error ?? "Refresh failed." });
        return;
      }
      setState({ status: "done", message: `Imported ${body.imported} listings.` });
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Refresh failed.",
      });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={run}
        disabled={state.status === "running"}
        aria-label="Refresh data from the stores"
        className="grid size-9 place-items-center rounded-full border border-line bg-surface text-ink-muted transition-colors hover:text-ink disabled:opacity-60"
      >
        <RefreshCw className={cn("size-4", state.status === "running" && "animate-spin")} />
      </button>

      {state.message && (
        <p
          role="status"
          className={cn(
            "absolute right-0 top-[calc(100%+8px)] z-20 w-64 rounded-xl border px-3 py-2 text-[12px] leading-snug",
            state.status === "error"
              ? "border-[#f0c9c9] bg-[#fdeaea] text-[#a33131]"
              : "border-line bg-surface text-ink-muted",
          )}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
