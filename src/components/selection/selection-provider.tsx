"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * A selection of apps that survives navigation.
 *
 * The point is picking across pages — two apps from this filter, two from the
 * next — so it cannot live in a URL parameter that a filter change would wipe.
 * sessionStorage keeps it for the tab and forgets it afterwards, which is the
 * lifetime a comparison basket actually has.
 */
const KEY = "appscraper:selection";

type SelectionValue = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
  ready: boolean;
};

const SelectionContext = createContext<SelectionValue | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  // Rendered empty on the server and on the first client paint, then filled:
  // reading storage during render would make the markup differ from the HTML
  // React just hydrated.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(KEY);
      if (stored) setIds(JSON.parse(stored) as string[]);
    } catch {
      // A blocked or full store is not worth breaking the page over.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      // Same: the selection still works for this page view.
    }
  }, [ids, ready]);

  const toggle = useCallback((id: string) => {
    setIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<SelectionValue>(
    () => ({ ids, has: (id) => ids.includes(id), toggle, clear, ready }),
    [ids, toggle, clear, ready],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection(): SelectionValue {
  const value = useContext(SelectionContext);
  if (!value) throw new Error("useSelection must be used inside SelectionProvider");
  return value;
}
