"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";

type Ctx = { pending: boolean; run: (fn: () => void) => void };

const FilterTransitionContext = createContext<Ctx>({ pending: false, run: (fn) => fn() });

/**
 * Filtering navigates, and a server-rendered navigation takes long enough that
 * without this the UI simply freezes: the click appears to do nothing. Sharing
 * one transition lets the results dim while the next page is on its way.
 */
export function FilterTransitionProvider({ children }: { children: ReactNode }) {
  const [pending, startTransition] = useTransition();

  return (
    <FilterTransitionContext.Provider value={{ pending, run: (fn) => startTransition(fn) }}>
      {children}
    </FilterTransitionContext.Provider>
  );
}

export function useFilterTransition() {
  return useContext(FilterTransitionContext);
}

export function PendingOverlay({ children }: { children: ReactNode }) {
  const { pending } = useFilterTransition();

  return (
    <div
      aria-busy={pending}
      className={pending ? "pointer-events-none opacity-55 transition-opacity duration-150" : undefined}
    >
      {children}
    </div>
  );
}

export function PendingBar() {
  const { pending } = useFilterTransition();
  if (!pending) return null;

  return (
    <div
      role="status"
      aria-label="Loading results"
      className="fixed inset-x-0 top-0 z-[70] h-0.5 overflow-hidden bg-transparent"
    >
      <span className="block h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] bg-accent" />
      <style>{`@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
    </div>
  );
}
