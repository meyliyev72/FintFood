"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { RecipeGrid, RecipeGridSkeleton } from "@/components/recipe/recipe-grid";
import { ErrorState, Pagination } from "@/components/shared";
import { EmptyState } from "@/components/ui";
import { useRecipeFilters } from "@/hooks/use-recipe-filters";
import { recipesApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { Paginated, Recipe } from "@/types";

/**
 * Paginated recipe grid for one category (§11).
 *
 * Page one is rendered by the server so the category is crawlable; the client
 * takes over from page two onwards, keyed on the shared `?page=` param so the
 * position is shareable and the back button works.
 */
export function CategoryRecipes({
  slug,
  initialPage,
}: {
  slug: string;
  initialPage: Paginated<Recipe>;
}) {
  const t = useTranslations("recipes");
  const tc = useTranslations("common");
  const tr = useTranslations("categories");
  const searchParams = useSearchParams();
  const { setPage, isPending } = useRecipeFilters();

  const requestedPage = useMemo(() => {
    const raw = Number(searchParams?.get("page"));
    return Number.isInteger(raw) && raw > 0 ? raw : 1;
  }, [searchParams]);

  // Page 1 came from the server; anything else is fetched here.
  const isInitial = requestedPage === initialPage.page;
  const query = useQuery({
    queryKey: queryKeys.recipes({ category: slug, page: requestedPage }),
    queryFn: () => recipesApi.list({ category: slug, page: requestedPage }),
    enabled: !isInitial,
    staleTime: 60_000,
  });

  const page = isInitial ? initialPage : query.data;
  const recipes = page?.results ?? [];
  const totalPages = page?.total_pages ?? 1;

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight text-fg sm:text-2xl">
          {tr("recipeCount", { count: page?.count ?? 0 })}
        </h2>
      </div>

      {query.isError ? (
        <ErrorState
          description={tc("somethingWentWrong")}
          onRetry={() => query.refetch()}
        />
      ) : (
        <div
          className={cn(
            "transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)]",
            (query.isFetching || isPending) && "opacity-60",
          )}
          aria-busy={query.isFetching || isPending || undefined}
        >
          {query.isPending && !page ? (
            <RecipeGridSkeleton count={8} />
          ) : recipes.length === 0 ? (
            <EmptyState title={tr("empty")} description={t("emptyHint")} />
          ) : (
            <>
              <RecipeGrid recipes={recipes} />
              <Pagination
                className="mt-10"
                page={requestedPage}
                totalPages={totalPages}
                onChange={setPage}
              />
            </>
          )}
        </div>
      )}
    </section>
  );
}
