"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  addFromRecipe,
  errorMessage,
  getRecipe,
  type RecipeDetail,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FavoriteButton } from "@/components/favorite-button";
import { ReviewSection } from "@/components/review-section";
import {
  Alert,
  Button,
  LoadingState,
  Stars,
} from "@/components/ui";

function RecipeInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const { user } = useAuth();

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [addingToList, setAddingToList] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("No recipe was specified.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getRecipe(slug)
      .then((data) => {
        if (!cancelled) setRecipe(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, user]);

  async function handleAddToList() {
    if (!recipe) return;
    if (!user) {
      setListError("Log in to build a shopping list.");
      return;
    }
    setAddingToList(true);
    setListError(null);
    setListMessage(null);
    try {
      const result = await addFromRecipe(recipe.id);
      setListMessage(result.detail);
    } catch (err) {
      setListError(errorMessage(err));
    } finally {
      setAddingToList(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <LoadingState label="Loading recipe…" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <Alert variant="error">{error ?? "Recipe not found."}</Alert>
        <div className="mt-6">
          <Link
            href="/recipes"
            className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            ← Back to recipes
          </Link>
        </div>
      </div>
    );
  }

  const nutrition = [
    recipe.calories !== null && `${recipe.calories} kcal`,
    recipe.protein && `${recipe.protein} g protein`,
    recipe.carbs && `${recipe.carbs} g carbs`,
    recipe.fat && `${recipe.fat} g fat`,
  ].filter(Boolean) as string[];

  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/recipes"
        className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
      >
        ← Back to recipes
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          {recipe.image ? (
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900 dark:to-teal-900">
              <span className="text-sm font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
                FintFood
              </span>
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            {recipe.category && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {recipe.category.name}
              </span>
            )}
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {recipe.difficulty}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {recipe.title}
          </h1>

          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            {recipe.average_rating !== null ? (
              <>
                <Stars rating={Number(recipe.average_rating)} />
                <span>
                  {Number(recipe.average_rating).toFixed(1)} ({recipe.review_count}{" "}
                  {recipe.review_count === 1 ? "review" : "reviews"})
                </span>
              </>
            ) : (
              <span>No ratings yet</span>
            )}
          </div>

          {recipe.description && (
            <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-400">
              {recipe.description}
            </p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">Prep</dt>
              <dd className="mt-1 font-semibold">{recipe.prep_time} min</dd>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">Cook</dt>
              <dd className="mt-1 font-semibold">{recipe.cooking_time} min</dd>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">Total</dt>
              <dd className="mt-1 font-semibold">{recipe.total_time} min</dd>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">Servings</dt>
              <dd className="mt-1 font-semibold">{recipe.servings}</dd>
            </div>
          </dl>

          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            By {recipe.author.display_name}
          </p>

          <div className="mt-6 flex flex-wrap items-start gap-3">
            <FavoriteButton recipeId={recipe.id} initial={recipe.is_favorite} />
            <Button onClick={handleAddToList} disabled={addingToList}>
              {addingToList ? "Adding…" : "Add to shopping list"}
            </Button>
          </div>

          {listMessage && (
            <div className="mt-3">
              <Alert variant="success">{listMessage}</Alert>
            </div>
          )}
          {listError && (
            <div className="mt-3">
              <Alert variant="warning">{listError}</Alert>
            </div>
          )}
        </div>
      </div>

      {nutrition.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">Nutrition</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {nutrition.map((item) => (
              <span
                key={item}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold tracking-tight">Ingredients</h2>
          <ul className="mt-4 space-y-2">
            {recipe.ingredients.map((ingredient) => (
              <li
                key={ingredient.id}
                className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2 text-sm dark:border-zinc-800"
              >
                <span className="text-zinc-800 dark:text-zinc-200">
                  {ingredient.name}
                </span>
                <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
                  {ingredient.quantity} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight">Instructions</h2>
          <ol className="mt-4 space-y-4">
            {recipe.steps.map((step) => (
              <li key={step.step_number} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                  {step.step_number}
                </span>
                <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {step.instruction}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {recipe.images.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">Gallery</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {recipe.images.map((image) =>
              image.url ? (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
                >
                  <Image
                    src={image.url}
                    alt={image.alt || recipe.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : null,
            )}
          </div>
        </section>
      )}

      <ReviewSection recipeId={recipe.id} initialReviews={recipe.reviews} />
    </article>
  );
}

export default function RecipePage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-zinc-500">Loading…</div>}>
      <RecipeInner />
    </Suspense>
  );
}
