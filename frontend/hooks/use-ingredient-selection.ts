"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

/** Query param carrying the selection, e.g. `?ingredients=3,17,42`. */
export const INGREDIENT_PARAM = "ingredients";

/**
 * URL-synced ingredient selection.
 *
 * The selection lives in the query string for the same reasons the recipe
 * filters do: the page is shareable, survives a refresh, and the back button
 * steps through previous selections. Ids are normalised (de-duplicated, sorted
 * ascending) so two orderings of the same basket produce one cache key and one
 * shareable URL.
 */
export function useIngredientSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = useMemo(() => new URLSearchParams(searchParams?.toString() ?? ""), [searchParams]);

  const selected = useMemo(() => parseIds(current.get(INGREDIENT_PARAM)), [current]);

  const commit = useCallback(
    (ids: number[]) => {
      const next = new URLSearchParams(current);
      const normalized = normalize(ids);
      if (normalized.length) next.set(INGREDIENT_PARAM, normalized.join(","));
      else next.delete(INGREDIENT_PARAM);

      const search = next.toString();
      startTransition(() => {
        const href = search ? `${pathname}?${search}` : pathname;
        // `replace` keeps the history clean: picking a sixth onion should not
        // make "back" walk through every intermediate chip tap.
        router.replace(href, { scroll: false });
      });
    },
    [current, pathname, router],
  );

  const toggle = useCallback(
    (id: number) => {
      commit(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
    },
    [commit, selected],
  );

  const clearAll = useCallback(() => commit([]), [commit]);

  return { selected, toggle, clearAll, isPending, current };
}

function normalize(ids: number[]): number[] {
  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

/** Parses `3,17,42`, discarding anything that is not a positive integer id. */
function parseIds(raw: string | null): number[] {
  if (!raw) return [];
  const parsed = raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
  return normalize(parsed);
}
