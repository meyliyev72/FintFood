"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage, toggleFavorite, type RecipeSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  IconClock,
  IconFlame,
  IconHeart,
  IconLeaf,
  IconStar,
  IconUsers,
} from "@/components/icons";

export function RecipeCard({
  recipe,
  className,
  onFavoriteChange,
}: {
  recipe: RecipeSummary;
  className?: string;
  onFavoriteChange?: (isFavorite: boolean) => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(recipe.is_favorite);
  const [busy, setBusy] = useState(false);

  async function handleFavorite(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const result = await toggleFavorite(recipe.id);
      setIsFavorite(result.is_favorite);
      onFavoriteChange?.(result.is_favorite);
    } catch (err) {
      console.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      <Link
        href={{ pathname: "/recipe", query: { slug: recipe.slug } }}
        className="flex flex-1 flex-col"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {recipe.image ? (
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900 dark:to-teal-900">
              <IconLeaf width={40} height={40} className="text-emerald-600/70" />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />

          {recipe.category && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-zinc-800 shadow-sm backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-100">
              {recipe.category.name}
            </span>
          )}

          {recipe.average_rating !== null && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-zinc-800 shadow-sm backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-100">
              <IconStar width={13} height={13} filled className="text-amber-500" />
              {Number(recipe.average_rating).toFixed(1)}
              <span className="font-normal text-zinc-400">
                ({recipe.review_count})
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
            {recipe.title}
          </h3>
          {recipe.description && (
            <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {recipe.description}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-zinc-100 pt-3 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <IconClock width={14} height={14} />
              {recipe.total_time} min
            </span>
            <span className="inline-flex items-center gap-1">
              <IconUsers width={14} height={14} />
              {recipe.servings}
            </span>
            <span className="inline-flex items-center gap-1 capitalize">
              <IconFlame width={14} height={14} />
              {recipe.difficulty}
            </span>
            <span className="inline-flex items-center gap-1">
              <IconLeaf width={14} height={14} />
              {recipe.ingredients_count}
            </span>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={handleFavorite}
        disabled={busy}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className={cn(
          "absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur transition-colors disabled:opacity-60 dark:bg-zinc-900/90",
          isFavorite
            ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
            : "text-zinc-500 hover:text-rose-500",
        )}
      >
        <IconHeart width={18} height={18} filled={isFavorite} />
      </button>
    </div>
  );
}
