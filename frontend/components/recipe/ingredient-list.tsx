"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { RecipeIngredient } from "@/types";

/**
 * Ingredient list with a client-side cooking-mode checklist (§7).
 *
 * The checked state is deliberately not persisted: it is a per-cooking-session
 * aid, and pretending otherwise would imply a backend feature that does not
 * exist.
 */
export function IngredientList({
  ingredients,
  className,
}: {
  ingredients: RecipeIngredient[];
  className?: string;
}) {
  const t = useTranslations("recipe");
  const format = useFormatter();
  const [checked, setChecked] = useState<Set<number>>(() => new Set());

  function toggle(id: number) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={className}>
      <p className="mb-3 text-sm text-fg-muted" aria-live="polite">
        {t("ingredientsProgress", {
          done: format.number(checked.size),
          total: format.number(ingredients.length),
        })}
      </p>

      <ul className="m-0 list-none space-y-1 p-0">
        {ingredients.map((item) => {
          const isChecked = checked.has(item.id);
          // `quantity` ships as a 2-decimal DecimalField string ("800.00");
          // formatting through the active locale trims the meaningless zeros
          // and applies the locale's own separators (§3.3).
          const amount = Number(item.quantity);
          const quantity = Number.isFinite(amount)
            ? format.number(amount, { maximumFractionDigits: 2 })
            : item.quantity;
          return (
            <li key={item.id}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5",
                  "transition-colors duration-[var(--duration-fast)] hover:bg-surface-hover",
                )}
              >
                <span className="relative flex size-5 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(item.id)}
                    className="peer size-5 cursor-pointer appearance-none rounded-[5px] border border-border-strong bg-surface transition-colors checked:border-brand checked:bg-brand"
                  />
                  <svg
                    viewBox="0 0 12 12"
                    className="pointer-events-none absolute size-3 text-fg-inverse opacity-0 transition-opacity duration-[var(--duration-fast)] peer-checked:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 6.2 4.6 8.8 10 3.4" />
                  </svg>
                </span>

                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm transition-[color,text-decoration-color] duration-[var(--duration-fast)]",
                    isChecked ? "text-fg-subtle line-through" : "text-fg",
                  )}
                >
                  {item.name}
                </span>

                <span
                  className={cn(
                    "shrink-0 text-sm tabular-nums transition-colors duration-[var(--duration-fast)]",
                    isChecked ? "text-fg-subtle" : "text-fg-muted",
                  )}
                >
                  {quantity} {item.unit}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
