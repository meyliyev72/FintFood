"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Check, Plus, X } from "lucide-react";

import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A selectable ingredient chip, shared by the picker grid and the selected bar.
 *
 * §22.2: the chip moves between the two locations with a `layoutId` spring.
 * Exactly one element per ingredient carries that id at a time — the grid row
 * hands it over by rendering an inert placeholder while the selection is
 * active — otherwise Framer Motion would have two owners for the same node.
 */
export function IngredientChip({
  id,
  label,
  selected,
  onToggle,
  /** `grid` chips live in the catalog; `bar` chips are removable. */
  variant = "grid",
  count,
  className,
}: {
  id: number;
  label: string;
  selected: boolean;
  onToggle: (id: number) => void;
  variant?: "grid" | "bar";
  /** Shown next to the label, e.g. "in 12 recipes". */
  count?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const layoutId = `ingredient-chip-${id}`;

  // In the grid, a selected chip collapses to an empty slot: the real element
  // has flown up to the bar, and this placeholder holds its place.
  if (variant === "grid" && selected) {
    return (
      <li
        aria-hidden
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-border px-3.5",
          "text-sm opacity-0",
          className,
        )}
      >
        {label}
      </li>
    );
  }

  if (variant === "bar") {
    return (
      <motion.li
        layout={!prefersReducedMotion}
        layoutId={prefersReducedMotion ? undefined : layoutId}
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={
          prefersReducedMotion
            ? { opacity: 0, transition: { duration: 0.1 } }
            : { opacity: 0, scale: 0.8, transition: { duration: 0.15 } }
        }
        transition={spring}
        className="relative"
      >
        <button
          type="button"
          onClick={() => onToggle(id)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border border-brand bg-brand-soft pr-2 pl-3 text-sm font-medium text-fg-brand",
            "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
            "hover:bg-brand hover:text-fg-inverse active:scale-[0.97]",
          )}
        >
          <Check className="size-3.5 shrink-0" aria-hidden />
          <span className="max-w-[12rem] truncate">{label}</span>
          <X className="size-3.5 shrink-0 opacity-70" aria-hidden />
        </button>
        <span className="sr-only">remove</span>
      </motion.li>
    );
  }

  return (
    <motion.li
      layout={!prefersReducedMotion}
      layoutId={prefersReducedMotion ? undefined : layoutId}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={
        prefersReducedMotion
          ? { opacity: 0, transition: { duration: 0.1 } }
          : { opacity: 0, scale: 0.8, transition: { duration: 0.15 } }
      }
      transition={spring}
    >
      <button
        type="button"
        id={`grid-chip-${id}`}
        onClick={() => onToggle(id)}
        className={cn(
          "inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-sm font-medium text-fg-muted",
          "transition-[background-color,border-color,color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
          "hover:border-border-strong hover:bg-surface-hover hover:text-fg active:scale-[0.97]",
          className,
        )}
      >
        <Plus className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
        <span className="truncate">{label}</span>
        {count != null ? (
          <span className="shrink-0 text-xs tabular-nums text-fg-subtle">{count}</span>
        ) : null}
      </button>
    </motion.li>
  );
}
