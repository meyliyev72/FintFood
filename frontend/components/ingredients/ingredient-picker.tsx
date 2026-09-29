"use client";

import { AnimatePresence } from "framer-motion";
import { Check, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { IngredientChip } from "@/components/ingredients/ingredient-chip";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/form";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { Ingredient, IngredientCategory } from "@/types";

/**
 * Ingredient catalog browser (§8).
 *
 * Ingredients are grouped into the ten seeded categories and filtered by a
 * debounced search box. Both the category tab and the search term are local
 * state — they narrow what is *shown*, not what is *selected*, so a search
 * never silently drops ingredients the user already picked.
 */
export function IngredientPicker({
  ingredients,
  categories,
  selected,
  onToggle,
  /** Focuses the selected bar after a grid chip flies up into it. */
  selectedBarRef,
  className,
}: {
  ingredients: Ingredient[];
  categories: IngredientCategory[];
  selected: number[];
  onToggle: (id: number) => void;
  selectedBarRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}) {
  const t = useTranslations("find");
  const tc = useTranslations("common");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [term, setTerm] = useState("");
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const debouncedTerm = useDebounce(term, 200);

  /**
   * Autocomplete: the six best catalog hits for what is currently typed.
   * Rendered only while the box has focus, so it never fights the grouped
   * grid below it.
   */
  const suggestions = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (needle.length < 2 || !openSuggestions) return [];
    return ingredients
      .filter((ingredient) => ingredient.name.toLowerCase().includes(needle))
      .sort((a, b) => {
        // Prefix matches first, then by how often the ingredient is used.
        const aStarts = a.name.toLowerCase().startsWith(needle) ? 1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(needle) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        return (b.usage_count ?? 0) - (a.usage_count ?? 0);
      })
      .slice(0, 6);
  }, [ingredients, term, openSuggestions]);

  const grouped = useMemo(() => {
    const needle = debouncedTerm.trim().toLowerCase();
    const groups = new Map<string, Ingredient[]>();
    for (const ingredient of ingredients) {
      if (needle && !ingredient.name.toLowerCase().includes(needle)) continue;
      const key = ingredient.category?.slug ?? "";
      const bucket = groups.get(key);
      if (bucket) bucket.push(ingredient);
      else groups.set(key, [ingredient]);
    }
    // Highest usage first inside each group: the useful ones float up.
    for (const bucket of groups.values()) {
      bucket.sort((a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0));
    }
    return groups;
  }, [ingredients, debouncedTerm]);

  const visibleCategories = useMemo(() => {
    if (debouncedTerm.trim()) {
      // While searching, show every group that still has a hit, in seed order.
      return categories.filter((category) => grouped.has(category.slug));
    }
    return categories;
  }, [categories, grouped, debouncedTerm]);

  useEffect(() => {
    // Keep the active tab valid when a search hides the current group.
    if (activeCategory && !visibleCategories.some((category) => category.slug === activeCategory)) {
      setActiveCategory("");
    }
  }, [activeCategory, visibleCategories]);

  const activeBucket = useMemo(
    () => (activeCategory ? (grouped.get(activeCategory) ?? []) : null),
    [activeCategory, grouped],
  );
  const totalShown = useMemo(
    () =>
      activeBucket
        ? activeBucket.length
        : Array.from(grouped.values()).reduce((sum, bucket) => sum + bucket.length, 0),
    [activeBucket, grouped],
  );

  // When a chip is picked, its grid slot becomes a placeholder and focus would
  // otherwise land on <body>. Hand it to the selected bar instead (§22.2 keeps
  // the chip, so this only covers the keyboard path).
  const lastAction = useRef<{ id: number; added: boolean } | null>(null);
  useEffect(() => {
    const action = lastAction.current;
    lastAction.current = null;
    if (!action) return;
    if (action.added) selectedBarRef?.current?.focus();
    else document.getElementById(`grid-chip-${action.id}`)?.focus();
  }, [selected, selectedBarRef]);

  function toggle(id: number) {
    lastAction.current = { id, added: !selected.includes(id) };
    onToggle(id);
  }

  return (
    <div className={cn("space-y-5", className)}>
      <div className="relative">
        <Input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onFocus={() => setOpenSuggestions(true)}
          // Deferred so a click on a suggestion is not cancelled by the blur.
          onBlur={() => window.setTimeout(() => setOpenSuggestions(false), 120)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          leadingIcon={<Search aria-hidden />}
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls="ingredient-suggestions"
          aria-autocomplete="list"
          autoComplete="off"
          trailingSlot={
            term ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setTerm("")}
                aria-label={tc("close")}
              >
                <X aria-hidden />
              </Button>
            ) : null
          }
        />

        {/* Autocomplete row. Scoped to an exact catalog hit so a partial
            "tom" still shows the full grouped list underneath. */}
        <AnimatePresence>
          {suggestions.length > 0 ? (
            <ul
              id="ingredient-suggestions"
              role="listbox"
              className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-[12px] border border-border bg-surface-raised p-1.5 shadow-[var(--shadow-pop)]"
            >
              {suggestions.map((ingredient) => {
                const isPicked = selected.includes(ingredient.id);
                return (
                  <li key={ingredient.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isPicked}
                      onClick={() => {
                        toggle(ingredient.id);
                        setTerm("");
                        setOpenSuggestions(false);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-hover"
                    >
                      <span className="truncate">{ingredient.name}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-fg-subtle">
                        {ingredient.category ? <span>{ingredient.category.name}</span> : null}
                        {isPicked ? <Check className="size-3.5 text-fg-brand" aria-hidden /> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Category tabs. Horizontally scrollable so 10 tabs never wrap on 320px. */}
      <div
        role="tablist"
        aria-label={t("group")}
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        <CategoryTab
          label={tc("all")}
          active={activeCategory === ""}
          onClick={() => setActiveCategory("")}
        />
        {visibleCategories.map((category) => (
          <CategoryTab
            key={category.id}
            label={category.name}
            active={activeCategory === category.slug}
            onClick={() => setActiveCategory(category.slug)}
          />
        ))}
      </div>

      {totalShown === 0 ? (
        <p className="rounded-[12px] border border-dashed border-border-strong px-4 py-8 text-center text-sm text-fg-muted">
          {t("noIngredients")}
        </p>
      ) : activeBucket ? (
        <ChipGrid
          ingredients={activeBucket}
          selected={selected}
          onToggle={toggle}
          label={categories.find((category) => category.slug === activeCategory)?.name}
        />
      ) : (
        <div className="space-y-6">
          {visibleCategories.map((category) => {
            const bucket = grouped.get(category.slug);
            if (!bucket?.length) return null;
            return (
              <ChipGrid
                key={category.id}
                ingredients={bucket}
                selected={selected}
                onToggle={toggle}
                label={category.name}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium",
        "transition-[background-color,border-color,color] duration-[var(--duration-fast)]",
        "active:scale-[0.97]",
        active
          ? "border-brand bg-brand text-fg-inverse"
          : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
      )}
    >
      {label}
    </button>
  );
}

function ChipGrid({
  ingredients,
  selected,
  onToggle,
  label,
}: {
  ingredients: Ingredient[];
  selected: number[];
  onToggle: (id: number) => void;
  label?: string;
}) {
  return (
    <section>
      {label ? (
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
          {label}
        </h3>
      ) : null}
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        <AnimatePresence initial={false} mode="popLayout">
          {ingredients.map((ingredient) => (
            <IngredientChip
              key={ingredient.id}
              id={ingredient.id}
              label={ingredient.name}
              selected={selected.includes(ingredient.id)}
              onToggle={onToggle}
              count={ingredient.usage_count}
            />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
