"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { RecipeGrid, RecipeGridSkeleton } from "@/components/recipe/recipe-grid";
import { ErrorState, Pagination } from "@/components/shared";
import { Button, EmptyState } from "@/components/ui";
import { Heart } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { favoritesApi } from "@/lib/api/user-data";
import { queryKeys } from "@/lib/query-keys";

const PAGE_SIZE = 12;

/** Favorites (§10): the same card and pagination the recipes list uses. */
export function FavoritesView() {
  const t = useTranslations("favorites");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const isAllowed = useRequireAuth();
  const [page, setPage] = useState(1);

  const { isLoading, isError, data, refetch } = useQuery({
    queryKey: [...queryKeys.favorites, page],
    queryFn: () => favoritesApi.list(page),
    enabled: isAllowed,
    staleTime: 30_000,
  });

  const recipes = (data?.results ?? []).map((favorite) => favorite.recipe);
  const totalPages = data?.total_pages ?? 1;

  if (!isAllowed) return <FavoritesSkeleton />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-14">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-fg-muted">{t("subtitle")}</p>
      </header>

      {isError ? (
        <ErrorState description={te("generic")} onRetry={() => refetch()} />
      ) : isLoading ? (
        <RecipeGridSkeleton count={PAGE_SIZE} />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-8" />}
          title={t("empty")}
          description={t("emptyHint")}
          action={
            <Button asChild variant="secondary">
              <Link href="/recipes">{t("explore")}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <RecipeGrid recipes={recipes} />
          <Pagination
            className="mt-10"
            page={page}
            totalPages={totalPages}
            onChange={setPage}
          />
        </>
      )}

      {data && data.count > PAGE_SIZE ? (
        <p className="mt-4 text-center text-sm text-fg-muted">
          {tc("of")} {data.count}
        </p>
      ) : null}
    </div>
  );
}

function FavoritesSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-14">
      <div className="mb-8 space-y-3">
        <div className="h-10 w-56 rounded-[var(--radius-control)] bg-surface-sunken" />
        <div className="h-4 w-72 rounded-[var(--radius-control)] bg-surface-sunken" />
      </div>
      <RecipeGridSkeleton count={8} />
    </div>
  );
}
