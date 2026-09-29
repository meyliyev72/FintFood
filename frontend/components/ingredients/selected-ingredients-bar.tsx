"use client";

import { AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { forwardRef } from "react";

import { IngredientChip } from "@/components/ingredients/ingredient-chip";
import { Button } from "@/components/ui";
import type { Ingredient } from "@/types";

/**
 * The selected-ingredients tray that sits above the results.
 *
 * Chips here carry the `layoutId` that animates them out of the picker grid
 * (§22.2). `AnimatePresence` with `popLayout` means removals and the
 * reflow of the remaining chips both animate instead of jumping.
 *
 * `tabIndex={-1}` gives keyboard users somewhere to land after a grid chip
 * flies up and takes its own focus with it.
 */
export const SelectedIngredientsBar = forwardRef<
  HTMLDivElement,
  {
    ingredients: Ingredient[];
    onToggle: (id: number) => void;
    onClear: () => void;
    onSubmit: () => void;
    isPending?: boolean;
  }
>(function SelectedIngredientsBar(
  { ingredients, onToggle, onClear, onSubmit, isPending = false },
  ref,
) {
  const t = useTranslations("find");

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] focus:outline-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-fg">
          {t("selected")}
          {ingredients.length > 0 ? (
            <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium tabular-nums text-fg-brand">
              {ingredients.length}
            </span>
          ) : null}
        </h2>

        {ingredients.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X aria-hidden />
            {t("clearAll")}
          </Button>
        ) : null}
      </div>

      {ingredients.length === 0 ? (
        <p className="mt-3 text-sm text-fg-muted">{t("selectPrompt")}</p>
      ) : (
        <>
          <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
            <AnimatePresence initial={false} mode="popLayout">
              {ingredients.map((ingredient) => (
                <IngredientChip
                  key={ingredient.id}
                  id={ingredient.id}
                  label={ingredient.name}
                  selected
                  variant="bar"
                  onToggle={onToggle}
                />
              ))}
            </AnimatePresence>
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button onClick={onSubmit} loading={isPending} loadingText={t("searching")}>
              {!isPending ? <Search aria-hidden /> : null}
              {t("findRecipes")}
            </Button>
            <p className="text-xs text-fg-subtle" aria-live="polite">
              {t("selectedHint", { count: ingredients.length })}
            </p>
          </div>
        </>
      )}
    </div>
  );
});
