"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Moon, Search, Sun } from "lucide-react";
import { navSections } from "@/lib/nav";
import { NavIcon } from "@/components/ui/icon";
import { AppIcon } from "@/components/ui/app-icon";
import { cn } from "@/lib/cn";

type Item = {
  id: string;
  label: string;
  hint?: string;
  icon?: string;
  iconUrl?: string | null;
  appId?: string;
  run: () => void;
};

type AppHit = { id: string; title: string; developer: string | null; iconUrl: string | null };

export type PaletteView = { id: string; name: string; path: string; query: string };

function setTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Storage can be blocked; the class change still applies for this session.
  }
}

/**
 * Keyboard-first navigation. This is a tool people live in for hours: reaching
 * for the sidebar and then a search box for every lookup is the slow path.
 */
export function CommandPalette({ savedViews = [] }: { savedViews?: PaletteView[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [apps, setApps] = useState<AppHit[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setApps([]);
      setActive(0);
      return;
    }
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Search the catalogue as you type, but only once typing settles.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setApps([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/apps?q=${encodeURIComponent(term)}&perPage=6`, {
          signal: controller.signal,
        });
        const body = await res.json();
        setApps(
          (body.data ?? []).map((a: Record<string, unknown>) => ({
            id: a.id as string,
            title: a.title as string,
            developer: (a.developer as string) ?? null,
            iconUrl: (a.iconUrl as string) ?? null,
          })),
        );
      } catch {
        // An aborted or failed search just leaves the app list empty.
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const items = useMemo<Item[]>(() => {
    const term = query.trim().toLowerCase();

    const views: Item[] = navSections.flatMap((section) =>
      section.items.flatMap((item) => [
        {
          id: item.href,
          label: item.label,
          hint: section.title,
          icon: item.icon,
          run: () => go(item.href),
        },
        ...(item.children ?? []).map((child) => ({
          id: child.href,
          label: child.label,
          hint: `${section.title} · ${item.label}`,
          icon: child.icon,
          run: () => go(child.href),
        })),
      ]),
    );

    const saved: Item[] = savedViews.map((view) => ({
      id: `saved:${view.id}`,
      label: view.name,
      hint: "Saved view",
      icon: "heart",
      run: () => go(`${view.path}${view.query ? `?${view.query}` : ""}`),
    }));

    const actions: Item[] = [
      {
        id: "theme-dark",
        label: "Switch to dark theme",
        hint: "Appearance",
        icon: "trending",
        run: () => {
          setTheme("dark");
          setOpen(false);
        },
      },
      {
        id: "theme-light",
        label: "Switch to light theme",
        hint: "Appearance",
        icon: "trending",
        run: () => {
          setTheme("light");
          setOpen(false);
        },
      },
    ];

    const appItems: Item[] = apps.map((app) => ({
      id: app.id,
      label: app.title,
      hint: app.developer ?? "App",
      appId: app.id,
      iconUrl: app.iconUrl,
      run: () => go(`/dashboard/apps/${encodeURIComponent(app.id)}`),
    }));

    const matches = (item: Item) =>
      !term || item.label.toLowerCase().includes(term) || item.hint?.toLowerCase().includes(term);

    return [
      ...appItems,
      ...saved.filter(matches),
      ...views.filter(matches),
      ...actions.filter(matches),
    ];
  }, [apps, query, go, savedViews]);

  useEffect(() => setActive(0), [items.length]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-[12.5px] text-ink-muted transition-colors hover:text-ink"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search or jump to…</span>
        <kbd className="hidden rounded border border-line bg-surface-muted px-1.5 py-0.5 text-[10.5px] sm:inline">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-start justify-center bg-panel/60 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_28px_70px_-30px_rgba(6,10,8,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Search className="size-4 shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((i) => Math.min(items.length - 1, i + 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                items[active]?.run();
              }
            }}
            placeholder="Search apps, jump to a view, change the theme…"
            aria-label="Search apps or jump to a view"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-faint"
          />
          <kbd className="rounded border border-line bg-surface-muted px-1.5 py-0.5 text-[10.5px] text-ink-faint">
            esc
          </kbd>
        </div>

        <ul ref={listRef} className="scroll-thin max-h-[52vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <li className="px-3 py-6 text-center text-[13px] text-ink-muted">Nothing matches that.</li>
          )}
          {items.map((item, index) => (
            <li key={`${item.id}:${index}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={item.run}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left",
                  index === active ? "bg-accent-soft text-accent-ink" : "hover:bg-surface-muted",
                )}
              >
                {item.appId ? (
                  <AppIcon id={item.appId} title={item.label} iconUrl={item.iconUrl} className="size-6" />
                ) : item.id.startsWith("theme-") ? (
                  item.id === "theme-dark" ? (
                    <Moon className="size-4 text-ink-muted" />
                  ) : (
                    <Sun className="size-4 text-ink-muted" />
                  )
                ) : (
                  <NavIcon name={item.icon ?? "apps"} className="size-4 text-ink-muted" />
                )}
                <span className="min-w-0 flex-1 truncate text-[13.5px]">{item.label}</span>
                {item.hint && (
                  <span className="hidden shrink-0 text-[11.5px] text-ink-faint sm:block">{item.hint}</span>
                )}
                {index === active && <CornerDownLeft className="size-3.5 shrink-0 opacity-60" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
