"use client";

import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useCallback, useMemo, useTransition } from "react";

import { readRecipeFilters, type RecipeFilters } from "@/types";

/** Query params that participate in the recipes list state (§6). */
export const RECIPE_FILTER_KEYS = ["query", "category", "time_range", "difficulty", "diet"] as const;

/**
 * URL-synced recipe list state.
 *
 * Filters live in the query string rather than React state so a filtered list
 * is shareable, survives a refresh, renders on the server and steps correctly
 * with the back button. All writes go through the locale-aware router.
 */
export function useRecipeFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = useMemo(() => new URLSearchParams(searchParams?.toString() ?? ""), [searchParams]);
  const filters: RecipeFilters = useMemo(() => readRecipeFilters(searchParams), [searchParams]);

  const activeCount = RECIPE_FILTER_KEYS.filter((key) => current.get(key)).length;

  const commit = useCallback(
    (next: URLSearchParams, options: { replace?: boolean } = {}) => {
      // Any filter change invalidates the current page offset.
      next.delete("page");
      const search = next.toString();
      const href = search ? `${pathname}?${search}` : pathname;
      startTransition(() => {
        if (options.replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
      });
    },
    [pathname, router],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      commit(next);
    },
    [commit, current],
  );

  const clearAll = useCallback(() => commit(new URLSearchParams()), [commit]);

  return { current, filters, activeCount, setParam, clearAll, isPending };
}
