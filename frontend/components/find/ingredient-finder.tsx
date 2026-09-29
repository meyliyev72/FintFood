"use client";

import { useQuery } from "@tanstack/react-query";
import { ChefHat, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";

import { IngredientPicker } from "@/components/ingredients/ingredient-picker";
import { SelectedIngredientsBar } from "@/components/ingredients/selected-ingredients-bar";
import { RecipeGrid, RecipeGridSkeleton } from "@/components/recipe/recipe-grid";
import { ErrorState } from "@/components/shared";
import { Button, EmptyState } from "@/components/ui";
import { useIngredientSelection } from "@/hooks/use-ingredient-selection";
import { recipesApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { Ingredient, IngredientCategory } from "@/types";

/** How many matches render before "load more". */
const PAGE_SIZE = 12;

/**
 * Find by Ingredients (§8) — the flagship feature.
 *
 * The catalog arrives from the server so the page is crawlable and the chips
 * paint immediately. The selection is URL state, so a basket is shareable, and
 * the match query re-runs as it changes; the explicit "Find Recipes" button
 * exists for the keyboard/AT path and simply scrolls to the results.
 *
 * The endpoint already sorts by match percentage then rating, so 100% matches
 * land at the top without any client-side bucketing.
 */
export function IngredientFinder({
  ingredients,
  categories,
}: {
  ingredients: Ingredient[];
  categories: IngredientCategory[];
}) {
  const t = useTranslations("find");
  const tc = useTranslations("common");
  const { selected, toggle, clearAll, isPending } = useIngredientSelection();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const resultsRef = useRef<HTMLDivElement>(null);
  const selectedBarRef = useRef<HTMLDivElement>(null);

  const byId = useMemo(() => new Map(ingredients.map((item) => [item.id, item])), [ingredients]);
  const selectedIngredients = useMemo(
    () => selected.map((id) => byId.get(id)).filter((item): item is Ingredient => Boolean(item)),
    [selected, byId],
  );

  const query = useQuery({
    queryKey: queryKeys.match(selected),
    queryFn: () => recipesApi.matchByIngredients(selected),
    enabled: selected.length > 0,
    staleTime: 5 * 60_000,
  });

  // A new basket means a new result set, so the "load more" window resets.
  const results = query.data?.results ?? [];
  const visible = results.slice(0, visibleCount);
  const hasMore = results.length > visibleCount;

  function submit() {
    setVisibleCount(PAGE_SIZE);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="mb-7 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-fg-muted">{t("subtitle")}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-10">
        <IngredientPicker
          ingredients={ingredients}
          categories={categories}
          selected={selected}
          onToggle={toggle}
          selectedBarRef={selectedBarRef}
        />

        {/* Sticky on desktop so the basket and results stay visible while
            scrolling a long ingredient list. */}
        <aside className="lg:sticky lg:top-24">
          <SelectedIngredientsBar
            ref={selectedBarRef}
            ingredients={selectedIngredients}
            onToggle={toggle}
            onClear={clearAll}
            onSubmit={submit}
            isPending={isPending}
          />

          {selected.length > 0 ? (
            <p className="mt-3 text-xs text-fg-subtle">{t("matchesOnlyHint")}</p>
          ) : null}
        </aside>
      </div>

      <section ref={resultsRef} className="mt-12 scroll-mt-24" aria-live="polite">
        {selected.length === 0 ? (
          <EmptyState
            icon={<ChefHat aria-hidden />}
            title={t("selectPrompt")}
            description={t("selectHint")}
          />
        ) : query.isError ? (
          <ErrorState
            description={query.error instanceof Error ? undefined : tc("somethingWentWrong")}
            onRetry={() => query.refetch()}
          />
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold tracking-tight text-fg sm:text-2xl">
                {t("resultsFound", { count: results.length })}
              </h2>
              {results.length > 0 ? (
                <p className="text-sm text-fg-muted">{t("sortedHint")}</p>
              ) : null}
            </div>

            <div
              className={cn(
                "transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)]",
                query.isFetching && "opacity-60",
              )}
              aria-busy={query.isFetching || undefined}
            >
              {query.isPending ? (
                <RecipeGridSkeleton count={6} />
              ) : results.length === 0 ? (
                <EmptyState
                  icon={<Search aria-hidden />}
                  title={t("noResults")}
                  description={t("noResultsHint")}
                />
              ) : (
                <>
                  <RecipeGrid recipes={visible} matchMode />
                  {hasMore ? (
                    <div className="mt-8 flex justify-center">
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                      >
                        {t("loadMore")}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
