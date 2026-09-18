"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

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
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const clearAll = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);

  return {
    params,
    set,
    clearAll,
    get: (key: string) => params.get(key),
    getAll: (key: string) => params.getAll(key),
  };
}
