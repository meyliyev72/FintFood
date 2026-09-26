"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { errorMessage, getFavorites, type RecipeSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { RecipeCard } from "@/components/recipe-card";
import {
  Alert,
  ButtonLink,
  EmptyState,
  LoadingState,
} from "@/components/ui";
import { IconHeart } from "@/components/icons";

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
          icon={<IconHeart width={26} height={26} />}
          action={<ButtonLink href="/login">Log in</ButtonLink>}
        >
          Save recipes you love and find them here later.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Favorites</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          {recipes.length} saved {recipes.length === 1 ? "recipe" : "recipes"}
        </p>
      </div>

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-8">
        {recipes.length === 0 ? (
          <EmptyState
            title="No favorites yet"
            icon={<IconHeart width={26} height={26} />}
            action={<ButtonLink href="/recipes">Browse recipes</ButtonLink>}
          >
            Tap the heart on any recipe to save it here.
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onFavoriteChange={(isFavorite) => {
                  if (!isFavorite) {
                    setRecipes((prev) => prev.filter((item) => item.id !== recipe.id));
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Looking for something new?{" "}
        <Link
          href="/find"
          className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Match recipes to your ingredients →
        </Link>
      </p>
    </div>
  );
}
