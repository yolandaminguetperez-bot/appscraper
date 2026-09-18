import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { FilterTransitionProvider, PendingBar } from "@/components/filters/filter-transition";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <FilterTransitionProvider>
      <a href="#main" className="skip-link">
        Skip to results
      </a>
      <PendingBar />
      <div className="flex h-dvh overflow-hidden bg-panel p-0">
        <Sidebar />
        <main
          id="main"
          className="dotted-canvas scroll-thin m-2 ml-0 flex-1 overflow-y-auto rounded-2xl bg-bg ring-1 ring-line"
        >
          {children}
        </main>
      </div>
    </FilterTransitionProvider>
  );
}
