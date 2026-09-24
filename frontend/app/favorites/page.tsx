"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  errorMessage,
  getFavorites,
  toggleFavorite,
  type RecipeSummary,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { RecipeCard } from "@/components/recipe-card";
import {
  Alert,
  ButtonLink,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/components/ui";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await getFavorites();
      setRecipes(page.results.map((favorite) => favorite.recipe));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, user, load]);

  async function remove(recipe: RecipeSummary) {
    try {
      await toggleFavorite(recipe.id);
      setRecipes((prev) => prev.filter((item) => item.id !== recipe.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (authLoading || (user && loading)) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <LoadingState label="Loading favorites…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Log in to see your favorites"
          action={<ButtonLink href="/login">Log in</ButtonLink>}
        >
          Save recipes you love and find them here later.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Favorites"
        subtitle={`${recipes.length} saved ${recipes.length === 1 ? "recipe" : "recipes"}`}
      />

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-8">
        {recipes.length === 0 ? (
          <EmptyState
            title="No favorites yet"
            action={<ButtonLink href="/recipes">Browse recipes</ButtonLink>}
          >
            Tap the save button on any recipe to add it here.
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="flex flex-col gap-2">
                <RecipeCard recipe={recipe} />
                <button
                  type="button"
                  onClick={() => remove(recipe)}
                  className="self-start text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Remove from favorites
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Looking for something new?{" "}
        <Link
          href="/find"
          className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Match recipes to your ingredients →
        </Link>
      </p>
    </div>
  );
}
