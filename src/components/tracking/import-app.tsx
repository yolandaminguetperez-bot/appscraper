"use client";

import Link from "next/link";
import { Download, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { importAppAction } from "@/app/actions/import";
import type { ImportResult } from "@/lib/sources/import";

/**
 * Brings a real app in from its store page.
 *
 * Until something is imported, the catalogue holds only the sample apps, whose
 * icons are generated because there is no real listing behind them. This is the
 * path to real apps, and real artwork with them.
 */
export function ImportApp() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="surface-card p-5">
      <h2 className="text-[15px] font-semibold">Import from the store</h2>
      <p className="pt-0.5 text-[12.5px] text-ink-muted">
        Paste an App Store or Google Play link — or an id like{" "}
        <code className="rounded bg-surface-muted px-1 py-0.5 text-[11.5px]">com.example.app</code>.
      </p>

      <form
        className="flex flex-wrap gap-2 pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          start(async () => setResult(await importAppAction(value)));
        }}
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://apps.apple.com/us/app/example/id123456789"
          aria-label="Store link or app id"
          className="min-w-[260px] flex-1 rounded-full border border-line bg-surface px-4 py-2 text-[13px] placeholder:text-ink-faint"
        />
        <button
          type="submit"
          disabled={pending || value.trim().length === 0}
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-panel transition-colors hover:bg-accent-ink hover:text-white disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {pending ? "Fetching…" : "Import"}
        </button>
      </form>

      {result?.ok && (
        <p className="pt-3 text-[13px]">
          <span className="text-pos">
            {result.alreadyKnown ? "Updated" : "Imported"} {result.app.title}
          </span>{" "}
          <Link
            href={`/dashboard/apps/${encodeURIComponent(result.app.id)}`}
            className="text-accent-ink underline underline-offset-2"
          >
            Open it
          </Link>
        </p>
      )}

      {result && !result.ok && (
        <p className="pt-3 text-[13px] text-neg">{result.detail}</p>
      )}
    </section>
  );
}
