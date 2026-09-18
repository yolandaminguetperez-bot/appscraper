"use client";

import { Bookmark, BookmarkCheck, Check, Trash2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteSavedViewAction, saveViewAction } from "@/app/actions/saved-views";
import type { SavedView } from "@/lib/db/saved-views";
import { cn } from "@/lib/cn";

/**
 * Suggests a name from the filters themselves, so saving is one click for the
 * common case and a rename only when the default is not good enough.
 */
function suggestName(params: URLSearchParams): string {
  const parts: string[] = [];
  const q = params.get("q");
  if (q) parts.push(`“${q}”`);

  const stores = params.getAll("store");
  if (stores.length === 1) parts.push(stores[0] === "ios" ? "App Store" : "Google Play");

  const cats = params.getAll("cat");
  if (cats.length === 1) parts.push(cats[0]);
  else if (cats.length > 1) parts.push(`${cats.length} categories`);

  const released = params.get("released");
  if (released) parts.push(`last ${released}d`);

  const signals = params.getAll("signal");
  if (signals.includes("ads")) parts.push("running ads");
  if (signals.includes("organic")) parts.push("with creators");

  const rating = params.get("minRating");
  if (rating) parts.push(`${rating}+ stars`);

  const revenue = params.get("minRevenue");
  if (revenue) parts.push(`$${Number(revenue).toLocaleString()}+ revenue`);

  return parts.slice(0, 3).join(" · ") || "All apps";
}

export function SaveView({ views, savedId }: { views: SavedView[]; savedId: string | null }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = params.toString();

  useEffect(() => {
    if (!open) return;
    setName(suggestName(params));
    // Let the panel mount before focusing, or the caret lands nowhere.
    const timer = setTimeout(() => inputRef.current?.select(), 30);

    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, params]);

  const save = () => {
    startTransition(async () => {
      await saveViewAction(name, pathname, query);
      setOpen(false);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteSavedViewAction(id, pathname);
      router.refresh();
    });
  };

  const forThisPage = views.filter((view) => view.path === pathname);
  const Icon = savedId ? BookmarkCheck : Bookmark;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition-colors",
          savedId || open
            ? "border-accent/40 bg-accent-soft text-accent-ink"
            : "border-line bg-surface text-ink-muted hover:text-ink",
        )}
      >
        <Icon className="size-4" />
        <span className="hidden sm:inline">{savedId ? "Saved" : "Save view"}</span>
        {forThisPage.length > 0 && (
          <span className="grid size-[18px] place-items-center rounded-full bg-accent/20 text-[11px] font-semibold text-accent-ink">
            {forThisPage.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(92vw,340px)] rounded-2xl border border-line bg-surface p-3 shadow-[0_24px_60px_-28px_rgba(16,21,17,0.45)]">
          {savedId ? (
            <p className="flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-[12.5px] text-accent-ink">
              <Check className="size-3.5" />
              These filters are already saved.
            </p>
          ) : (
            <div className="space-y-2">
              <label className="block text-[12px] text-ink-muted" htmlFor="save-view-name">
                Name this view
              </label>
              <div className="flex gap-2">
                <input
                  id="save-view-name"
                  ref={inputRef}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") save();
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={save}
                  disabled={pending || name.trim().length === 0}
                  className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-medium text-panel hover:bg-accent-ink hover:text-white disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {forThisPage.length > 0 && (
            <div className="pt-3">
              <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Saved views
              </p>
              <ul className="space-y-0.5">
                {forThisPage.map((view) => (
                  <li key={view.id} className="flex items-center gap-1">
                    <Link
                      href={`${view.path}${view.query ? `?${view.query}` : ""}`}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-[13px] hover:bg-surface-muted",
                        view.id === savedId && "text-accent-ink",
                      )}
                    >
                      {view.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(view.id)}
                      aria-label={`Delete saved view ${view.name}`}
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-faint hover:text-ink"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-ink-faint hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
