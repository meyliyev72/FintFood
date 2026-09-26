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
import { Alert, Badge, Button, EmptyState, Input, Spinner } from "@/components/ui";
import {
  IconBasket,
  IconCheck,
  IconSearch,
} from "@/components/icons";

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
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-500 px-6 py-8 text-white sm:px-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Cook from your fridge
        </h1>
        <p className="mt-2 max-w-2xl text-emerald-50">
          Select the ingredients you already have and we&apos;ll rank every recipe
          by how well it matches — including what&apos;s still missing.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Your ingredients</h2>
              <Badge tone="emerald">{selected.size} selected</Badge>
            </div>

            <div className="relative mt-4">
              <IconSearch
                width={18}
                height={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <Input
                type="search"
                className="pl-10"
                placeholder="Search ingredients…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveCategory("")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeCategory === ""
                    ? "bg-emerald-600 text-white"
                    : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.slug)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeCategory === category.slug
                      ? "bg-emerald-600 text-white"
                      : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto pr-1">
              {loadingCatalog ? (
                <div className="flex items-center gap-2 py-8 text-sm text-zinc-500">
                  <Spinner className="h-4 w-4" /> Loading ingredients…
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  No ingredients match.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {filtered.map((ingredient) => {
                    const isSelected = selected.has(ingredient.id);
                    return (
                      <button
                        key={ingredient.id}
                        type="button"
                        onClick={() => toggle(ingredient.id)}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                        }`}
                      >
                        {isSelected && <IconCheck width={13} height={13} />}
                        {ingredient.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={findMatches}
                disabled={selected.size === 0 || matching}
                className="flex-1"
              >
                {matching ? "Matching…" : "Find recipes"}
              </Button>
              {selected.size > 0 && (
                <Button variant="ghost" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
              )}
            </div>
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
            <EmptyState
              title="Pick your ingredients"
              icon={<IconBasket width={26} height={26} />}
            >
              Select a few items on the left and press <strong>Find recipes</strong>{" "}
              to see what you can cook right now.
            </EmptyState>
          ) : results.length === 0 ? (
            <EmptyState title="No matches yet" icon={<IconSearch width={26} height={26} />}>
              None of the recipes use the ingredients you selected. Try adding more.
            </EmptyState>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {results.length} matching {results.length === 1 ? "recipe" : "recipes"}
              </p>
              {results.map((recipe) => {
                const ready = recipe.missing_ingredients.length === 0;
                return (
                  <article
                    key={recipe.id}
                    className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row"
                  >
                    <Link
                      href={{ pathname: "/recipe", query: { slug: recipe.slug } }}
                      className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 sm:h-32 sm:w-44"
                    >
                      {recipe.image ? (
                        <Image
                          src={recipe.image}
                          alt={recipe.title}
                          fill
                          sizes="176px"
                          className="object-cover"
                        />
                      ) : null}
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={{ pathname: "/recipe", query: { slug: recipe.slug } }}
                          className="text-lg font-semibold leading-snug hover:text-emerald-700 dark:hover:text-emerald-400"
                        >
                          {recipe.title}
                        </Link>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                            ready
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
                          }`}
                        >
                          {recipe.match_percentage}% match
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={`h-full rounded-full ${
                            ready ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${recipe.match_percentage}%` }}
                        />
                      </div>

                      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                        {recipe.available_count}/{recipe.total_count} ingredients ·{" "}
                        {recipe.total_time} min ·{" "}
                        <span className="capitalize">{recipe.difficulty}</span>
                      </p>

                      {ready ? (
                        <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                          <IconCheck width={15} height={15} />
                          You have everything — ready to cook!
                        </div>
                      ) : (
                        <div className="mt-3 text-sm">
                          <span className="text-zinc-500 dark:text-zinc-400">
                            Still need:{" "}
                          </span>
                          <span className="text-zinc-700 dark:text-zinc-300">
                            {recipe.missing_ingredients.map((item) => item.name).join(", ")}
                          </span>
                        </div>
                      )}

                      {!ready && (
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
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
