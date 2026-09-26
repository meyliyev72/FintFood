"use client";

import { Clock, Star, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { memo } from "react";

import { Badge } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { mediaUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types";

/**
 * Recipe card used in every grid.
 *
 * `memo` matters here: the recipes list re-renders on every keystroke in the
 * search box, and cards are the most numerous nodes on the page.
 */
export const RecipeCard = memo(function RecipeCard({
  recipe,
  priority = false,
  className,
  matchPercentage,
}: {
  recipe: Recipe;
  /** Set on the first row so above-the-fold images are not lazy. */
  priority?: boolean;
  className?: string;
  /** Only present on "Find by Ingredients" results. */
  matchPercentage?: number;
}) {
  const t = useTranslations("recipe");
  const tf = useTranslations("filter");
  const tc = useTranslations("common");
  const image = mediaUrl(recipe.image);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface",
        "shadow-[var(--shadow-card)] transition-[transform,box-shadow,border-color] duration-[var(--duration-base)] ease-[var(--ease-standard)]",
        "hover:-translate-y-1 hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]",
        "motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {/* Whole-card click target; the title link below stays for a11y. */}
      <Link
        href={`/recipes/${recipe.slug}`}
        className="absolute inset-0 z-10"
        aria-label={recipe.title}
      >
        <span className="sr-only">{recipe.title}</span>
      </Link>

      <div className="relative aspect-[4/3] overflow-hidden bg-surface-sunken">
        {image ? (
          <Image
            src={image}
            alt={recipe.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-[var(--duration-slower)] ease-[var(--ease-standard)] group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-fg-subtle">
            <svg viewBox="0 0 24 24" className="size-10" fill="none" aria-hidden>
              <path
                d="M7 20h10M6 16h12M8 16a4 4 0 0 1-1.2-7.8A4.5 4.5 0 0 1 16 7.6 4.2 4.2 0 0 1 16 16H8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        <div className="absolute inset-x-2 top-2 z-20 flex items-start justify-between gap-2 pointer-events-none">
          {matchPercentage != null ? (
            <Badge tone={matchPercentage >= 80 ? "success" : matchPercentage >= 50 ? "accent" : "neutral"}>
              {t("matchBadge", { percentage: matchPercentage })}
            </Badge>
          ) : recipe.category ? (
            <Badge tone="neutral" className="bg-canvas/85 backdrop-blur-sm">
              {recipe.category.name}
            </Badge>
          ) : (
            <span />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-[15px] font-semibold leading-snug text-fg line-clamp-2-safe">
          <Link
            href={`/recipes/${recipe.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {recipe.title}
          </Link>
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-fg-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {recipe.total_time} {tc("minutes")}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden />
            {recipe.servings} {tc("servings")}
          </span>
          {recipe.average_rating ? (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-rating text-rating" aria-hidden />
              {recipe.average_rating}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5">
          <Badge size="sm">{tf(`difficulty.${recipe.difficulty}` as "difficulty.easy")}</Badge>
        </div>
      </div>
    </article>
  );
});
