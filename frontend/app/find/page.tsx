"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addFromRecipe,
  errorMessage,
  getIngredientCategories,
  getIngredients,
  matchByIngredients,
  type Ingredient,
  type IngredientCategory,
  type MatchResult,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Alert,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Spinner,
} from "@/components/ui";

export default function FindPage() {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getIngredients(), getIngredientCategories()])
      .then(([items, cats]) => {
        if (cancelled) return;
        setIngredients(items);
        setCategories(cats);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return ingredients.filter((ingredient) => {
      if (activeCategory && ingredient.category?.slug !== activeCategory) return false;
      if (term && !ingredient.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [ingredients, search, activeCategory]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function findMatches() {
    setMatching(true);
    setError(null);
    setListMessage(null);
    try {
      const response = await matchByIngredients(Array.from(selected));
      setResults(response.results);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setMatching(false);
    }
  }

  async function addMissing(recipe: MatchResult) {
    if (!user) {
      setError("Log in to build a shopping list.");
      return;
    }
    setError(null);
    setListMessage(null);
    try {
      const result = await addFromRecipe(
        recipe.id,
        recipe.missing_ingredients.map((item) => item.id),
      );
      setListMessage(result.detail);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Find by ingredients"
        subtitle="Select what you have at home and we'll rank recipes by how well they match."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold">Your ingredients</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {selected.size} selected
          </p>

          <div className="mt-4 space-y-3">
            <Input
              type="search"
              placeholder="Search ingredients…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory("")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  activeCategory === ""
                    ? "bg-emerald-600 text-white"
                    : "border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.slug)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    activeCategory === category.slug
                      ? "bg-emerald-600 text-white"
                      : "border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 max-h-96 overflow-y-auto pr-1">
            {loadingCatalog ? (
              <div className="flex items-center gap-2 py-8 text-sm text-zinc-500">
                <Spinner className="h-4 w-4" /> Loading ingredients…
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                No ingredients match.
              </p>
            ) : (
              <ul className="space-y-1">
                {filtered.map((ingredient) => (
                  <li key={ingredient.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                        checked={selected.has(ingredient.id)}
                        onChange={() => toggle(ingredient.id)}
                      />
                      <span className="text-zinc-800 dark:text-zinc-200">
                        {ingredient.name}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={findMatches} disabled={selected.size === 0 || matching}>
              {matching ? "Matching…" : "Find recipes"}
            </Button>
            {selected.size > 0 && (
              <Button variant="ghost" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            )}
          </div>
        </section>

        <section>
          {error && (
            <div className="mb-4">
              <Alert variant="error">{error}</Alert>
            </div>
          )}
          {listMessage && (
            <div className="mb-4">
              <Alert variant="success">{listMessage}</Alert>
            </div>
          )}

          {results === null ? (
            <EmptyState title="Pick your ingredients">
              Select a few items on the left and press{" "}
              <strong>Find recipes</strong> to see what you can cook right now.
            </EmptyState>
          ) : results.length === 0 ? (
            <EmptyState title="No matches yet">
              None of the recipes use the ingredients you selected. Try adding
              more.
            </EmptyState>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {results.length} matching{" "}
                {results.length === 1 ? "recipe" : "recipes"}
              </p>
              {results.map((recipe) => (
                <article
                  key={recipe.id}
                  className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row"
                >
                  <Link
                    href={{ pathname: "/recipe", query: { slug: recipe.slug } }}
                    className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 sm:w-40"
                  >
                    {recipe.image ? (
                      <Image
                        src={recipe.image}
                        alt={recipe.title}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    ) : null}
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={{ pathname: "/recipe", query: { slug: recipe.slug } }}
                        className="text-lg font-semibold hover:text-emerald-700 dark:hover:text-emerald-400"
                      >
                        {recipe.title}
                      </Link>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          recipe.match_percentage >= 100
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
                        }`}
                      >
                        {recipe.match_percentage}% match
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {recipe.available_count}/{recipe.total_count} ingredients ·{" "}
                      {recipe.total_time} min · {recipe.difficulty}
                    </p>

                    {recipe.missing_ingredients.length > 0 ? (
                      <div className="mt-3 text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Still need:{" "}
                        </span>
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {recipe.missing_ingredients
                            .map((item) => item.name)
                            .join(", ")}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        You have everything! Ready to cook.
                      </div>
                    )}

                    {recipe.missing_ingredients.length > 0 && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addMissing(recipe)}
                        >
                          Add missing to shopping list
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
