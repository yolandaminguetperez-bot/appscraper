"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navSections } from "@/lib/nav";
import { NavIcon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // On phones the sidebar is a drawer; navigating should close it.
  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open navigation"
        className="fixed left-3 top-3 z-40 grid size-10 place-items-center rounded-xl bg-panel text-panel-ink md:hidden"
      >
        <Menu className="size-5" />
      </button>

      {drawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-panel/50 md:hidden"
        />
      )}

    <aside
      className={cn(
        "z-50 flex h-full shrink-0 flex-col bg-panel text-panel-ink transition-[width] duration-200",
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-[248px] max-md:transition-transform",
        drawerOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
        collapsed ? "w-[76px]" : "w-[248px]",
      )}
    >
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-panel-soft ring-1 ring-panel-line">
          <span className="size-3.5 rounded-[5px] bg-accent" />
        </span>
        {!collapsed && <span className="text-[17px] font-semibold tracking-tight">AppScraper</span>}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto grid size-8 place-items-center rounded-lg text-panel-ink-muted hover:bg-panel-soft hover:text-panel-ink max-md:hidden"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation"
          className="ml-auto grid size-8 place-items-center rounded-lg text-panel-ink-muted hover:bg-panel-soft md:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="scroll-thin flex-1 overflow-y-auto px-3 pb-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-5">
            {!collapsed && (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-panel-ink-muted">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-panel-soft text-panel-ink ring-1 ring-accent/60"
                        : "text-panel-ink-muted hover:bg-panel-soft hover:text-panel-ink",
                    )}
                  >
                    <NavIcon name={item.icon} className="size-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.children && (
                      <ChevronRight className="ml-auto size-4 opacity-60" />
                    )}
                  </Link>
                  {!collapsed && item.children && (
                    <ul className="mt-1 space-y-1 pl-6">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px]",
                              isActive(child.href)
                                ? "text-accent"
                                : "text-panel-ink-muted hover:text-panel-ink",
                            )}
                          >
                            <NavIcon name={child.icon} className="size-4 shrink-0" />
                            <span className="truncate">{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-panel-line p-3">
        <div className="flex items-center gap-3 rounded-xl bg-panel-soft px-3 py-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
            A
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">Local account</p>
              <p className="truncate text-[11px] text-panel-ink-muted">Free · unlimited</p>
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}
