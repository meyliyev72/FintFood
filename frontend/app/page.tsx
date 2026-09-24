"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRecipes, type RecipesPage } from "@/lib/api";
import { RecipeCard } from "@/components/recipe-card";
import { ButtonLink, LoadingState } from "@/components/ui";

const ERROR_MESSAGE =
  "The recipe catalog is temporarily unavailable. Please try again shortly.";

export default function Home() {
  const [data, setData] = useState<RecipesPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRecipes({ page_size: 6 })
      .then((page) => {
        if (!cancelled) setData(page);
      })
      .catch(() => {
        if (!cancelled) setError(ERROR_MESSAGE);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              Smart recipe search by your ingredients
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Cook from what&apos;s already in your fridge.
            </h1>
            <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Enter what you have at home and FintFood tells you exactly which
              recipes you can cook right now — and which single ingredients would
              unlock the rest.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/find" size="lg">
                Find recipes I can cook
              </ButtonLink>
              <ButtonLink href="/recipes" variant="secondary" size="lg">
                Browse all recipes
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          How FintFood works
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              1
            </span>
            <h3 className="mt-4 text-lg font-semibold">List your ingredients</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Check off the ingredients you already have in your kitchen.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              2
            </span>
            <h3 className="mt-4 text-lg font-semibold">Get matches</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Recipes are sorted into Ready and Almost there based on what you
              have.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              3
            </span>
            <h3 className="mt-4 text-lg font-semibold">Cook and shop</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Follow step-by-step instructions and add missing items to your
              shopping list.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Latest recipes
            </h2>
            {data && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {data.count} recipes in the catalog
              </p>
            )}
          </div>
          <Link
            href="/recipes"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            View all →
          </Link>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950">
            <p className="font-semibold text-amber-800 dark:text-amber-200">{error}</p>
          </div>
        ) : !data ? (
          <div className="mt-8">
            <LoadingState label="Loading recipes…" />
          </div>
        ) : data.results.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            No recipes yet. Run{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
              python manage.py seed_data
            </code>{" "}
            on the backend to add demo content.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {data.results.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
