import Image from "next/image";
import Link from "next/link";
import type { RecipeSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

export function RecipeCard({
  recipe,
  className,
}: {
  recipe: RecipeSummary;
  className?: string;
}) {
  return (
    <Link
      href={{ pathname: "/recipe", query: { slug: recipe.slug } }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
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
        {recipe.is_favorite && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs text-red-500 shadow backdrop-blur dark:bg-zinc-900/90">
            ♥
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
    </Link>
  );
}
