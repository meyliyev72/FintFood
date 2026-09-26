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
import { Alert, Badge, Button, LoadingState, Stars } from "@/components/ui";
import {
  IconArrowRight,
  IconBasket,
  IconChef,
  IconClock,
  IconFlame,
  IconLeaf,
  IconUsers,
} from "@/components/icons";

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

  const stats = [
    { label: "Prep", value: `${recipe.prep_time} min`, icon: <IconClock width={16} height={16} /> },
    { label: "Cook", value: `${recipe.cooking_time} min`, icon: <IconFlame width={16} height={16} /> },
    { label: "Total", value: `${recipe.total_time} min`, icon: <IconChef width={16} height={16} /> },
    { label: "Servings", value: String(recipe.servings), icon: <IconUsers width={16} height={16} /> },
  ];

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <nav className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Home
        </Link>
        <span>/</span>
        <Link href="/recipes" className="hover:text-emerald-700 dark:hover:text-emerald-400">
          Recipes
        </Link>
        <span>/</span>
        <span className="truncate text-zinc-700 dark:text-zinc-300">{recipe.title}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-zinc-100 shadow-sm dark:bg-zinc-800">
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
              <IconLeaf width={44} height={44} className="text-emerald-600/70" />
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {recipe.category && <Badge tone="emerald">{recipe.category.name}</Badge>}
            <Badge tone="zinc" className="capitalize">
              {recipe.difficulty}
            </Badge>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {recipe.title}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            {recipe.average_rating !== null ? (
              <>
                <Stars rating={Number(recipe.average_rating)} />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {Number(recipe.average_rating).toFixed(1)}
                </span>
                <span>
                  ({recipe.review_count}{" "}
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

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-zinc-200/80 bg-white p-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <dt className="flex items-center justify-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {stat.icon}
                  {stat.label}
                </dt>
                <dd className="mt-1 text-sm font-bold">{stat.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            By{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {recipe.author.display_name}
            </span>
          </p>

          <div className="mt-6 flex flex-wrap items-start gap-3">
            <FavoriteButton recipeId={recipe.id} initial={recipe.is_favorite} />
            <Button onClick={handleAddToList} disabled={addingToList}>
              <IconBasket width={18} height={18} />
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
              <Badge key={item} tone="zinc" className="px-3.5 py-1.5 text-sm">
                {item}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <IconLeaf width={20} height={20} className="text-emerald-600" />
              Ingredients
            </h2>
            <ul className="mt-4 space-y-1">
              {recipe.ingredients.map((ingredient) => (
                <li
                  key={ingredient.id}
                  className="flex items-center justify-between gap-3 border-b border-zinc-100 py-2.5 text-sm last:border-0 dark:border-zinc-800"
                >
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {ingredient.name}
                  </span>
                  <span className="shrink-0 font-medium text-zinc-500 dark:text-zinc-400">
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight">Instructions</h2>
          <ol className="mt-4 space-y-5">
            {recipe.steps.map((step) => (
              <li key={step.step_number} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-sm">
                  {step.step_number}
                </span>
                <p className="pt-1 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
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
                  className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800"
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

      <div className="mt-10">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          <IconArrowRight width={16} height={16} className="rotate-180" />
          Back to all recipes
        </Link>
      </div>
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
