"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, ShoppingBasket } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { FavoriteButton } from "@/components/recipe/favorite-button";
import { Button } from "@/components/ui";
import { nextParam } from "@/hooks/use-safe-redirect";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/client";
import { shoppingListApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/providers/auth-provider";
import type { Recipe } from "@/types";

/**
 * Detail-page primary actions (§7): save the recipe and push every ingredient
 * onto the shopping list.
 *
 * The heart is optimistic locally. The shopping-list add reports how many rows
 * were created versus merged, so the toast tells the truth about what the
 * server actually did rather than always claiming a plain add.
 */
export function RecipeActions({ recipe }: { recipe: Recipe }) {
  const t = useTranslations("recipe");
  const ts = useTranslations("shoppingList");
  const te = useTranslations("errors");
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [added, setAdded] = useState(false);

  const mutation = useMutation({
    mutationFn: () => shoppingListApi.addFromRecipe(recipe.id),
    onSuccess: (result) => {
      setAdded(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppingList });
      toast.success(
        result.merged > 0
          ? ts("addedWithMerges", { added: result.added, merged: result.merged })
          : ts("added", { count: result.added }),
      );
    },
    onError: (error) => {
      if (error instanceof ApiError && error.isUnauthorized) {
        router.push(`/login${nextParam(pathname)}`);
        return;
      }
      toast.error(te("generic"));
    },
  });

  function requireAuth(): boolean {
    if (isAuthenticated) return true;
    router.push(`/login${nextParam(pathname)}`);
    return false;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="lg"
        loading={mutation.isPending}
        loadingText={t("addingToList")}
        disabled={added}
        onClick={() => {
          if (!requireAuth()) return;
          mutation.mutate();
        }}
      >
        {added ? <Check aria-hidden /> : <ShoppingBasket aria-hidden />}
        {added ? ts("added", { count: mutation.data?.added ?? 0 }) : t("addToList")}
      </Button>

      <FavoriteButton
        recipeId={recipe.id}
        initialIsFavorite={recipe.is_favorite}
        size="md"
        showLabel
        variant="inline"
        className="h-12"
      />

      {/* Owner-only. The API enforces this too (`IsOwnerOrReadOnly`); hiding it
          keeps a stray edit URL from looking like a broken page. */}
      {!isLoading && isAuthenticated && user?.id === recipe.author.id ? (
        <Button asChild variant="secondary" size="lg" className="h-12">
          <Link href={`/recipes/${recipe.slug}/edit`}>
            <Pencil aria-hidden />
            {t("editRecipe")}
          </Link>
        </Button>
      ) : null}

      {!isLoading && !isAuthenticated ? (
        <button
          type="button"
          onClick={() => router.push(`/login${nextParam(pathname)}`)}
          className="text-sm text-fg-muted underline underline-offset-4 transition-colors hover:text-fg-brand"
        >
          {t("signInToAddList")}
        </button>
      ) : null}
    </div>
  );
}
