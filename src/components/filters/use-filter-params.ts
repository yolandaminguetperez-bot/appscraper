"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useFilterTransition } from "@/components/filters/filter-transition";

export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { pending, run } = useFilterTransition();

  const set = useCallback(
    (patch: Record<string, string | string[] | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        next.delete(key);
        if (value === null || value === "") continue;
        if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
        else next.set(key, value);
      }
      next.delete("page");
      run(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    },
    [params, pathname, router, run],
  );

  const clearAll = useCallback(
    () => run(() => router.replace(pathname, { scroll: false })),
    [pathname, router, run],
  );

  return {
    params,
    pending,
    set,
    clearAll,
    get: (key: string) => params.get(key),
    getAll: (key: string) => params.getAll(key),
  };
}
