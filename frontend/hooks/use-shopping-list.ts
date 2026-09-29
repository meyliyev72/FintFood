"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { shoppingListApi } from "@/lib/api/user-data";
import { queryKeys } from "@/lib/query-keys";
import type { Paginated, ShoppingListItem, ShoppingListItemInput } from "@/types";

/**
 * Shopping list read + mutations.
 *
 * The API does the merging, so a duplicate is never created here: `add` returns
 * whatever the server decided (created or summed) and we simply refetch. Only
 * the local, reversible operations — ticking a box, editing a quantity,
 * deleting a row — are applied optimistically, because those are the
 * interactions that feel broken at 300ms of latency.
 */

function replaceItem(
  page: Paginated<ShoppingListItem> | undefined,
  updated: ShoppingListItem,
): Paginated<ShoppingListItem> | undefined {
  if (!page) return page;
  return {
    ...page,
    results: page.results.map((item) => (item.id === updated.id ? updated : item)),
  };
}

function removeItem(
  page: Paginated<ShoppingListItem> | undefined,
  id: number,
): Paginated<ShoppingListItem> | undefined {
  if (!page) return page;
  return { ...page, results: page.results.filter((item) => item.id !== id) };
}

function rollback(client: QueryClient, snapshot: Paginated<ShoppingListItem> | undefined) {
  if (snapshot) client.setQueryData(queryKeys.shoppingList, snapshot);
}

export function useShoppingList({ enabled = true }: { enabled?: boolean } = {}) {
  const client = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.shoppingList,
    queryFn: () => shoppingListApi.list(),
    // No point asking for per-user data before the session is known.
    enabled,
    staleTime: 30_000,
  });

  const items = useMemo(() => query.data?.results ?? [], [query.data]);

  const groups = useMemo(() => groupByCategory(items), [items]);
  const remainingCount = useMemo(
    () => items.filter((item) => !item.is_completed).length,
    [items],
  );
  const completedCount = items.length - remainingCount;

  const toggle = useMutation({
    mutationFn: ({ id, isCompleted }: { id: number; isCompleted: boolean }) =>
      shoppingListApi.update(id, { is_completed: isCompleted }),
    onMutate: async ({ id, isCompleted }) => {
      const snapshot = client.getQueryData<Paginated<ShoppingListItem>>(queryKeys.shoppingList);
      client.setQueryData<Paginated<ShoppingListItem>>(queryKeys.shoppingList, (page) =>
        replaceItem(page, { id, is_completed: isCompleted } as ShoppingListItem),
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => rollback(client, context?.snapshot),
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.shoppingList }),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<ShoppingListItemInput> }) =>
      shoppingListApi.update(id, input),
    onMutate: async ({ id, input }) => {
      const snapshot = client.getQueryData<Paginated<ShoppingListItem>>(queryKeys.shoppingList);
      client.setQueryData<Paginated<ShoppingListItem>>(queryKeys.shoppingList, (page) =>
        replaceItem(page, {
          ...(page?.results.find((item) => item.id === id) ?? { id }),
          ...input,
        } as ShoppingListItem),
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => rollback(client, context?.snapshot),
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.shoppingList }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => shoppingListApi.remove(id),
    onMutate: async (id) => {
      const snapshot = client.getQueryData<Paginated<ShoppingListItem>>(queryKeys.shoppingList);
      client.setQueryData<Paginated<ShoppingListItem>>(queryKeys.shoppingList, (page) =>
        removeItem(page, id),
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => rollback(client, context?.snapshot),
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.shoppingList }),
  });

  const add = useMutation({
    mutationFn: (input: ShoppingListItemInput) => shoppingListApi.add(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.shoppingList }),
  });

  const clearCompleted = useMutation({
    mutationFn: () => shoppingListApi.clearCompleted(),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.shoppingList }),
  });

  return {
    items,
    groups,
    remainingCount,
    completedCount,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    toggle,
    update,
    remove,
    add,
    clearCompleted,
  };
}

/**
 * Groups items by their server-localized category label, keeping incomplete
 * rows above completed ones (§22.2: a ticked row reflows to the bottom of its
 * group).
 */
export function groupByCategory(
  items: ShoppingListItem[],
): { category: string; items: ShoppingListItem[] }[] {
  const buckets = new Map<string, ShoppingListItem[]>();
  for (const item of items) {
    const key = item.category || "";
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }

  return [...buckets.entries()]
    .map(([category, rows]) => ({
      category,
      items: [
        ...rows.filter((item) => !item.is_completed),
        ...rows.filter((item) => item.is_completed),
      ],
    }))
    .sort((a, b) => {
      const aEmpty = a.items.every((item) => item.is_completed);
      const bEmpty = b.items.every((item) => item.is_completed);
      if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
      return a.category.localeCompare(b.category);
    });
}
