import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { FilterTransitionProvider, PendingBar } from "@/components/filters/filter-transition";
import { IconSprite } from "@/components/ui/icon-sprite";
import { SelectionProvider } from "@/components/selection/selection-provider";
import { SelectionBar } from "@/components/selection/selection-bar";
import { QuickLookProvider } from "@/components/quicklook/quick-look-provider";
import { QuickLookPanel } from "@/components/quicklook/quick-look-panel";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <FilterTransitionProvider>
      <SelectionProvider>
        <QuickLookProvider>
          <a href="#main" className="skip-link">
            Skip to results
          </a>
          <PendingBar />
          {/* Once per document: every view below repeats these icons per row. */}
          <IconSprite />
          <div className="flex h-dvh overflow-hidden bg-panel p-0">
            <Sidebar />
            <main
              id="main"
              className="dotted-canvas scroll-thin m-2 ml-0 flex-1 overflow-y-auto rounded-2xl bg-bg ring-1 ring-line"
            >
              {children}
            </main>
          </div>
          <SelectionBar />
          <QuickLookPanel />
        </QuickLookProvider>
      </SelectionProvider>
    </FilterTransitionProvider>
  );
}
