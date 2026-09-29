"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { RecipeForm } from "@/components/recipe/recipe-form";
import { ErrorState } from "@/components/shared";
import { useRouter } from "@/i18n/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { categoriesApi } from "@/lib/api/catalog";

/**
 * Create-recipe page (§12).
 *
 * Categories are fetched here so the form receives a ready list; the form itself
 * is a client component because react-hook-form owns the whole draft.
 */
export function RecipeCreateView() {
  const t = useTranslations("recipeForm");
  const te = useTranslations("errors");
  const router = useRouter();
  const isAllowed = useRequireAuth();

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    enabled: isAllowed,
    staleTime: 60 * 60 * 1000,
  });

  if (!isAllowed) return <RecipeFormSkeleton />;

  if (categories.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState description={te("loadFailed")} onRetry={() => categories.refetch()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-14">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {t("createTitle")}
        </h1>
        <p className="mt-2 text-fg-muted">{t("createSubtitle")}</p>
      </header>

      <RecipeForm
        mode="create"
        categories={categories.data ?? []}
        onSaved={(recipe) => {
          router.push(`/recipes/${recipe.slug}`);
          router.refresh();
        }}
      />
    </div>
  );
}

/** Auth-gated: shown while the session check and the category list settle. */
export function RecipeFormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-16 sm:px-6 lg:px-14" aria-busy>
      <div className="h-9 w-64 rounded-[var(--radius-control)] bg-surface-sunken" />
      <div className="h-4 w-80 rounded-[var(--radius-control)] bg-surface-sunken" />
      <div className="space-y-3 pt-4">
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            className="h-14 rounded-[var(--radius-card)] bg-surface-sunken/70"
          />
        ))}
      </div>
    </div>
  );
}
