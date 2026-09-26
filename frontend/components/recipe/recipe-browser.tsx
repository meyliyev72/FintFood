"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import {
  RecipeFilterPanel,
  RecipeFilterToolbar,
} from "@/components/recipe/recipe-filter-bar";
import { RecipeGrid, RecipeGridSkeleton } from "@/components/recipe/recipe-grid";
import { ErrorState } from "@/components/shared";
import { Button, EmptyState } from "@/components/ui";
import { Input } from "@/components/ui/form";
import { useDebounce } from "@/hooks/use-debounce";
import { useRecipeFilters } from "@/hooks/use-recipe-filters";
import { recipesApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { Category, Paginated, Recipe } from "@/types";

/**
 * Filterable recipe list.
 *
 * Page 1 is passed in from the server component so the page is crawlable and
 * paints fast; further pages load on demand. Filter and search state live in
 * the URL, so a filtered list is shareable and the back button works.
 */
export function RecipeBrowser({
  categories,
  initialPage,
}: {
  categories: Category[];
  initialPage: Paginated<Recipe>;
}) {
  const t = useTranslations("recipes");
  const tc = useTranslations("common");
  const { filters, activeCount, clearAll } = useRecipeFilters();

  const query = useInfiniteQuery({
    queryKey: queryKeys.recipes(filters),
    initialPageParam: initialPage.page,
    queryFn: ({ pageParam }) => recipesApi.list({ ...filters, page: pageParam as number }),
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < (lastPage.total_pages ?? 1) ? (lastPage.page ?? 1) + 1 : undefined,
    staleTime: 60_000,
  });

  const pages = useMemo(() => query.data?.pages ?? [initialPage], [query.data, initialPage]);
  const recipes = useMemo(() => pages.flatMap((page) => page.results), [pages]);
  const totalCount = pages[0]?.count ?? 0;
  const isInitialLoading = query.isPending && recipes.length === 0;
  // §22.2: results dim while a new query is in flight instead of unmounting.
  const isRefetching = query.isFetching && !query.isFetchingNextPage && !isInitialLoading;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-fg-muted">{t("subtitle")}</p>
      </header>

      <RecipeSearchField />
      <RecipeFilterToolbar
        categories={categories}
        resultCount={totalCount}
        activeCount={activeCount}
      />

      <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:items-start lg:gap-8">
        <aside className="sticky top-24 hidden rounded-[var(--radius-card)] border border-border bg-surface p-5 lg:block">
          <h2 className="mb-4 text-sm font-semibold text-fg">{t("filters")}</h2>
          <RecipeFilterPanel categories={categories} />
        </aside>

        <div
          className={cn(
            "transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)]",
            isRefetching && "opacity-60",
          )}
          aria-busy={isRefetching || undefined}
        >
          {query.isError ? (
            <ErrorState description={tc("somethingWentWrong")} onRetry={() => query.refetch()} />
          ) : isInitialLoading ? (
            <RecipeGridSkeleton count={8} />
          ) : recipes.length === 0 ? (
            <EmptyState
              icon={<Search aria-hidden />}
              title={t("empty")}
              description={t("emptyHint")}
              action={
                <Button variant="outline" onClick={clearAll}>
                  {t("clearFilters")}
                </Button>
              }
            />
          ) : (
            <>
              <RecipeGrid recipes={recipes} />
              {query.hasNextPage ? (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => query.fetchNextPage()}
                    loading={query.isFetchingNextPage}
                    loadingText={t("loadMore")}
                  >
                    {t("loadMore")}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Debounced search box (§6, §19). The visible value is local for responsiveness
 * and is written to the URL after 300ms, which is what drives the query.
 */
function RecipeSearchField() {
  const t = useTranslations("recipes");
  const { current, setParam, isPending } = useRecipeFilters();
  const urlQuery = current.get("query") ?? "";
  const [value, setValue] = useState(urlQuery);
  const debounced = useDebounce(value, 300);

  // Keep the box in step with back/forward navigation and external clears.
  useEffect(() => setValue(urlQuery), [urlQuery]);

  useEffect(() => {
    if (debounced !== urlQuery) setParam("query", debounced || null);
  }, [debounced, setParam, urlQuery]);

  return (
    <div className="relative mb-5">
      <Input
        type="search"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        leadingIcon={<Search aria-hidden />}
        trailingSlot={
          value ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setValue("")}
              aria-label={t("clearSearch")}
            >
              <X aria-hidden />
            </Button>
          ) : null
        }
      />
      {isPending ? (
        <span
          aria-hidden
          className="pointer-events-none absolute right-11 top-1/2 size-3.5 -translate-y-1/2 animate-pulse rounded-full bg-brand"
        />
      ) : null}
    </div>
  );
}
