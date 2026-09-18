"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type QuickLookValue = {
  openId: string | null;
  open: (id: string) => void;
  close: () => void;
};

const QuickLookContext = createContext<QuickLookValue | null>(null);

/**
 * Which app the quick-look panel is showing, if any.
 *
 * Deliberately not a route: the point is to inspect an app *without* losing the
 * list, its filters and its scroll position.
 */
export function QuickLookProvider({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const close = useCallback(() => setOpenId(null), []);
  const open = useCallback((id: string) => setOpenId(id), []);

  useEffect(() => {
    if (!openId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, close]);

  const value = useMemo(() => ({ openId, open, close }), [openId, open, close]);
  return <QuickLookContext.Provider value={value}>{children}</QuickLookContext.Provider>;
}

export function useQuickLook(): QuickLookValue {
  const value = useContext(QuickLookContext);
  if (!value) throw new Error("useQuickLook must be used inside QuickLookProvider");
  return value;
}
