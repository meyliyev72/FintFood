"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getCategories,
  getRecipes,
  type Category,
  type RecipesPage,
} from "@/lib/api";
import { RecipeCard } from "@/components/recipe-card";
import { ButtonLink, LoadingState, SectionHeading } from "@/components/ui";
import {
  IconArrowRight,
  IconBasket,
  IconChef,
  IconLeaf,
  IconSearch,
  IconSparkles,
} from "@/components/icons";

const ERROR_MESSAGE =
  "The recipe catalog is temporarily unavailable. Please try again shortly.";

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<RecipesPage | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState("");

  useEffect(() => {
    let cancelled = false;
    getRecipes({ page_size: 6, ordering: "avg_rating" })
      .then((page) => {
        if (!cancelled) setData(page);
      })
      .catch(() => {
        if (!cancelled) setError(ERROR_MESSAGE);
      });
    getCategories()
      .then((items) => {
        if (!cancelled) setCategories(items);
      })
      .catch(() => setCategories([]));
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = term.trim();
    router.push(query ? `/recipes/?query=${encodeURIComponent(query)}` : "/recipes/");
  }

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur">
              <IconSparkles width={14} height={14} />
              Smart recipe search by your ingredients
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl">
              Cook from what&apos;s already in your fridge.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-emerald-50">
              Tell FintFood what you have at home and instantly see which recipes
              you can cook right now — and which single ingredient unlocks the
              rest.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-1.5 shadow-xl shadow-emerald-900/20"
              role="search"
            >
              <IconSearch width={20} height={20} className="ml-3 shrink-0 text-zinc-400" />
              <input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search recipes, ingredients…"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Search
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/find"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <IconBasket width={18} height={18} />
                Match my ingredients
              </Link>
              <Link
                href="/recipes"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Browse all recipes
                <IconArrowRight width={18} height={18} />
              </Link>
            </div>

            {data && (
              <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
                <div>
                  <dt className="text-sm text-emerald-100">Recipes</dt>
                  <dd className="text-2xl font-bold">{data.count}</dd>
                </div>
                <div>
                  <dt className="text-sm text-emerald-100">Categories</dt>
                  <dd className="text-2xl font-bold">{categories.length}</dd>
                </div>
                <div>
                  <dt className="text-sm text-emerald-100">Always free</dt>
                  <dd className="text-2xl font-bold">100%</dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading
            title="Browse by category"
            subtitle="Find the perfect dish for any occasion."
            action={
              <Link
                href="/recipes"
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
              >
                View all <IconArrowRight width={16} height={16} />
              </Link>
            }
          />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.slice(0, 10).map((category) => (
              <Link
                key={category.id}
                href={`/recipes/?category=${category.slug}`}
                className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
              >
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900 dark:to-teal-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="relative p-3 text-white">
                  <p className="text-sm font-bold leading-tight">{category.name}</p>
                  <p className="text-xs text-white/80">
                    {category.recipe_count} recipes
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading title="How FintFood works" />
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <IconBasket width={22} height={22} />,
                title: "List your ingredients",
                text: "Check off what you already have in your kitchen.",
              },
              {
                icon: <IconChef width={22} height={22} />,
                title: "Get smart matches",
                text: "Recipes are ranked by how well they match what you have.",
              },
              {
                icon: <IconLeaf width={22} height={22} />,
                title: "Cook and shop",
                text: "Follow the steps and add missing items to your shopping list.",
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-zinc-200/80 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                  {step.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {step.text}
                </p>
                <span className="absolute right-5 top-5 text-3xl font-black text-zinc-200/70 dark:text-zinc-800">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
        <SectionHeading
          title="Top rated recipes"
          subtitle={data ? `${data.count} recipes in the catalog` : undefined}
          action={
            <Link
              href="/recipes"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
            >
              View all <IconArrowRight width={16} height={16} />
            </Link>
          }
        />

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
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.results.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 px-8 py-12 text-white sm:px-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Have a recipe worth sharing?
              </h2>
              <p className="mt-2 max-w-lg text-zinc-300">
                Publish it on FintFood and help others cook from what they already
                have.
              </p>
            </div>
            <ButtonLink href="/recipes/new" size="lg" className="shrink-0">
              Add your recipe
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
