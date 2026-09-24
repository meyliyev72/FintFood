"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  errorMessage,
  getCategories,
  getRecipes,
  type Category,
  type RecipesPage,
} from "@/lib/api";
import { RecipeCard } from "@/components/recipe-card";
import {
  Alert,
  Button,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  Select,
} from "@/components/ui";

const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const TIME_RANGES = [
  { value: "under-15", label: "Under 15 min" },
  { value: "15-30", label: "15–30 min" },
  { value: "30-60", label: "30–60 min" },
  { value: "60+", label: "60+ min" },
];

const DIETS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "healthy", label: "Healthy (<500 kcal)" },
  { value: "high-protein", label: "High protein" },
];

const ORDERINGS = [
  { value: "-created_at", label: "Newest" },
  { value: "avg_rating", label: "Top rated" },
  { value: "review_count", label: "Most reviewed" },
  { value: "total_time", label: "Quickest" },
  { value: "title", label: "A–Z" },
];

function RecipesInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<RecipesPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("query") ?? "");

  const page = Number(searchParams.get("page") || "1");

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getRecipes({
      page,
      page_size: 12,
      category: searchParams.get("category") ?? undefined,
      difficulty: searchParams.get("difficulty") ?? undefined,
      time_range: searchParams.get("time_range") ?? undefined,
      diet: searchParams.get("diet") ?? undefined,
      ordering: searchParams.get("ordering") ?? undefined,
      query: searchParams.get("query") ?? undefined,
    })
      .then((result) => {
        if (!cancelled) setData(result);
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
  }, [searchParams, page]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  useEffect(() => {
    const current = searchParams.get("query") ?? "";
    if (search === current) return;
    const timer = setTimeout(() => setParam("query", search), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters = ["category", "difficulty", "time_range", "diet", "query"].some(
    (key) => searchParams.get(key),
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Recipes"
        subtitle={
          data ? `${data.count} recipes available` : "Browse the full catalog"
        }
      />

      <div className="mt-8 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Search
          </label>
          <Input
            type="search"
            placeholder="Search by title or ingredient…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Category
          </label>
          <Select
            value={searchParams.get("category") ?? ""}
            onChange={(event) => setParam("category", event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name} ({category.recipe_count})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Difficulty
          </label>
          <Select
            value={searchParams.get("difficulty") ?? ""}
            onChange={(event) => setParam("difficulty", event.target.value)}
          >
            <option value="">Any difficulty</option>
            {DIFFICULTIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Total time
          </label>
          <Select
            value={searchParams.get("time_range") ?? ""}
            onChange={(event) => setParam("time_range", event.target.value)}
          >
            <option value="">Any time</option>
            {TIME_RANGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Diet
          </label>
          <Select
            value={searchParams.get("diet") ?? ""}
            onChange={(event) => setParam("diet", event.target.value)}
          >
            <option value="">Any diet</option>
            {DIETS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Sort by
          </label>
          <Select
            value={searchParams.get("ordering") ?? "-created_at"}
            onChange={(event) => setParam("ordering", event.target.value)}
          >
            {ORDERINGS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
            Clear filters
          </Button>
        </div>
      )}

      <div className="mt-8">
        {error ? (
          <Alert variant="error">{error}</Alert>
        ) : loading ? (
          <LoadingState label="Loading recipes…" />
        ) : !data || data.results.length === 0 ? (
          <EmptyState title="No recipes match your filters">
            Try removing a filter or searching for something else.
          </EmptyState>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data.results.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>

            {data.total_pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setParam("page", String(page - 1))}
                >
                  ← Previous
                </Button>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Page {data.page} of {data.total_pages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= data.total_pages}
                  onClick={() => setParam("page", String(page + 1))}
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-zinc-500">Loading…</div>}>
      <RecipesInner />
    </Suspense>
  );
}
