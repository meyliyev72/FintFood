"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getRecipes,
  type RecipeSummary,
  type RecipesPage,
} from "@/lib/api";

function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900 dark:to-teal-900">
            <span className="text-sm font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
              FintFood
            </span>
          </div>
        )}
        {recipe.category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-zinc-800 shadow backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-100">
            {recipe.category.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-semibold leading-snug tracking-tight">
          {recipe.title}
        </h3>
        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {recipe.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span>{recipe.total_time} min</span>
          <span>
            {recipe.servings} {recipe.servings === 1 ? "serving" : "servings"}
          </span>
          <span>{recipe.difficulty}</span>
          <span>{recipe.ingredients_count} ingredients</span>
          {recipe.average_rating !== null && (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              ★ {Number(recipe.average_rating).toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

const LOADING_MESSAGE = "Loading recipes…";
const ERROR_MESSAGE =
  "The recipe catalog is temporarily unavailable. Please try again shortly.";

export default function Home() {
  const [data, setData] = useState<RecipesPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRecipes(1)
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
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-emerald-50">
              F
            </span>
            FintFood
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300 sm:flex">
            <a href="#recipes" className="hover:text-zinc-900 dark:hover:text-white">
              Recipes
            </a>
            <a href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-white">
              How it works
            </a>
            <a
              href="/api/v1/docs/"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              API docs
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
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
                recipes you can cook right now — and which single ingredients
                would unlock the rest.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#recipes"
                  className="rounded-full bg-emerald-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Browse recipes
                </a>
                <a
                  href="#how-it-works"
                  className="rounded-full border border-zinc-300 px-6 py-3 text-center font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  How it works
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
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

        <section id="recipes" className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Recipes
              </h2>
              {data && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {data.count} recipes in the catalog
                </p>
              )}
            </div>
          </div>

          {error ? (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950">
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                {error}
              </p>
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                The API at{" "}
                <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900">
                  {process.env.NEXT_PUBLIC_API_URL ?? "/api/v1"}
                </code>{" "}
                is not responding right now.
              </p>
            </div>
          ) : !data ? (
            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              {LOADING_MESSAGE}
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
      </main>

      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-emerald-50">
              F
            </span>
            FintFood
          </div>
          <p>Cook with what you have.</p>
          <p>
            API:{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
              /api/v1/
            </code>
          </p>
        </div>
      </footer>
    </>
  );
}