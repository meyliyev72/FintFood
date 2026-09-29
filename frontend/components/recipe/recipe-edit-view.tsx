"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { RecipeForm } from "@/components/recipe/recipe-form";
import { RecipeFormSkeleton } from "@/components/recipe/recipe-create-view";
import { ErrorState } from "@/components/shared";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { categoriesApi } from "@/lib/api/catalog";
import { recipesApi } from "@/lib/api/recipes";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/client";

/**
 * Edit-recipe page (§13).
 *
 * The owner check is duplicated from the API's `IsOwnerOrReadOnly` on purpose:
 * a non-author should see a plain message rather than a form that fails on
 * submit, and the server remains the authority either way.
 */
export function RecipeEditView({ slug }: { slug: string }) {
  const t = useTranslations("recipeForm");
  const tr = useTranslations("recipe");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const recipe = useQuery({
    queryKey: queryKeys.recipe(slug),
    queryFn: () => recipesApi.detail(slug),
    enabled: isAuthenticated,
    retry: false,
  });

  const categories = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categoriesApi.list(),
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000,
  });

  const remove = useMutation({
    mutationFn: () => recipesApi.remove(slug),
    onSuccess: () => {
      toast.success(tr("deleteRecipe"));
      // Prefix match: this drops every recipe list, detail and match result.
      void queryClient.invalidateQueries({ queryKey: ["recipes"] });
      router.push("/recipes");
      router.refresh();
    },
    onError: () => toast.error(te("saveFailed")),
  });

  if (authLoading || !isAuthenticated) return <RecipeFormSkeleton />;

  if (recipe.isError) {
    const notFound = recipe.error instanceof ApiError && recipe.error.status === 404;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState
          title={notFound ? tr("notFound") : undefined}
          description={notFound ? tr("notFoundHint") : te("loadFailed")}
          onRetry={notFound ? undefined : () => recipe.refetch()}
        />
        <BackLink to={`/recipes/${slug}`} label={tc("back")} onClick={() => router.push(`/recipes/${slug}`)} />
      </div>
    );
  }

  const data = recipe.data;
  if (!data || categories.isLoading) return <RecipeFormSkeleton />;

  if (data.author.id !== user?.id) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState description={t("notOwner")} />
        <BackLink
          to={`/recipes/${slug}`}
          label={tc("back")}
          onClick={() => router.push(`/recipes/${slug}`)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-14">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {t("editTitle")}
        </h1>
        <p className="mt-2 text-fg-muted">{t("editSubtitle")}</p>
      </header>

      <RecipeForm
        mode="edit"
        recipe={data}
        categories={categories.data ?? []}
        onSaved={(saved) => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.recipe(slug) });
          void queryClient.invalidateQueries({ queryKey: ["recipes"] });
          router.push(`/recipes/${saved.slug}`);
          router.refresh();
        }}
        onDelete={() => setConfirmOpen(true)}
        deleting={remove.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("deleteConfirmTitle")}
        description={tr("deleteRecipeConfirm", { title: data.title })}
        confirmLabel={tc("delete")}
        cancelLabel={t("keepEditing")}
        isPending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}

/** Localized "back to the recipe" escape hatch under an error state. */
function BackLink({
  label,
  onClick,
}: {
  to: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={onClick}
        className="text-sm font-medium text-brand underline-offset-4 hover:underline"
      >
        {label}
      </button>
    </div>
  );
}
