"use client";

import { motion } from "framer-motion";

import { RecipeCard } from "@/components/recipe/recipe-card";
import { Skeleton } from "@/components/ui";
import { cardHover, staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Recipe, RecipeMatch } from "@/types";

type CardData = Recipe | RecipeMatch;

/** Responsive grid of recipe cards. */
export function RecipeGrid({
  recipes,
  matchMode = false,
  className,
  priorityCount = 3,
}: {
  recipes: CardData[];
  /** Renders the match badge and widens cards for match results. */
  matchMode?: boolean;
  className?: string;
  /** Number of leading cards whose image loads eagerly. */
  priorityCount?: number;
}) {
  return (
    <motion.ul
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={cn(
        "grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {recipes.map((recipe, index) => {
        const match = matchMode ? (recipe as RecipeMatch) : null;
        return (
          <motion.li key={recipe.id} variants={staggerItem} className="flex">
            <RecipeCard
              recipe={recipe}
              priority={index < priorityCount}
              matchPercentage={match?.match_percentage}
              className="w-full"
            />
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/** Card-shaped skeletons shown while a list query is in flight. */
export function RecipeGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <ul
      className={cn(
        "grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-2.5 p-4">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-1.5 pt-1">
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A single card that lifts on hover; used in sidebars and rails. */
export function RecipeCardHover({ recipe, className }: { recipe: Recipe; className?: string }) {
  return (
    <motion.div variants={cardHover} initial="rest" whileHover="hover" className={className}>
      <RecipeCard recipe={recipe} />
    </motion.div>
  );
}
