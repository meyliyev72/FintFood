"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { BottomSheet } from "@/components/ui/overlay";
import { Button } from "@/components/ui";
import { CheckboxRow, Select } from "@/components/ui/form";
import { useRecipeFilters } from "@/hooks/use-recipe-filters";
import { cn } from "@/lib/utils";
import type { Category, Diet, Difficulty, TimeRange } from "@/types";

const TIME_RANGES: TimeRange[] = ["under-15", "15-30", "30-60", "60+"];
const DIET_OPTIONS: Diet[] = ["vegetarian", "healthy", "high-protein"];

/** Explicit key maps, so labels stay in sync with messages/*.json. */
const TIME_LABELS: Record<TimeRange, "timeUnder15" | "time15to30" | "time30to60" | "time60plus"> = {
  "under-15": "timeUnder15",
  "15-30": "time15to30",
  "30-60": "time30to60",
  "60+": "time60plus",
};

const DIFFICULTY_LABELS: Record<Difficulty, "difficultyEasy" | "difficultyMedium" | "difficultyHard"> = {
  easy: "difficultyEasy",
  medium: "difficultyMedium",
  hard: "difficultyHard",
};

const DIET_LABELS: Record<Diet, "dietVegetarian" | "dietHealthy" | "dietHighProtein"> = {
  vegetarian: "dietVegetarian",
  healthy: "dietHealthy",
  "high-protein": "dietHighProtein",
};

/** The actual filter controls. Rendered in the desktop sidebar and the mobile sheet. */
export function RecipeFilterPanel({
  categories,
  className,
}: {
  categories: Category[];
  className?: string;
}) {
  const t = useTranslations("filter");
  const tc = useTranslations("common");
  const tr = useTranslations("recipes");
  const { current, activeCount, setParam, clearAll } = useRecipeFilters();

  return (
    <div className={cn("space-y-6", className)}>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
          {t("category")}
        </legend>
        <Select
          value={current.get("category") ?? ""}
          onChange={(event) => setParam("category", event.target.value || null)}
          options={[
            { value: "", label: tc("all") },
            ...categories.map((category) => ({ value: category.slug, label: category.name })),
          ]}
          aria-label={t("category")}
        />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
          {t("time")}
        </legend>
        <div className="grid grid-cols-2 gap-1.5">
          {TIME_RANGES.map((range) => {
            const active = current.get("time_range") === range;
            return (
              <button
                key={range}
                type="button"
                aria-pressed={active}
                onClick={() => setParam("time_range", active ? null : range)}
                className={chipClass(active)}
              >
                {t(TIME_LABELS[range])}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
          {t("difficulty")}
        </legend>
        <div className="grid grid-cols-3 gap-1.5">
          {(["easy", "medium", "hard"] as Difficulty[]).map((level) => {
            const active = current.get("difficulty") === level;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={active}
                onClick={() => setParam("difficulty", active ? null : level)}
                className={chipClass(active)}
              >
                {t(DIFFICULTY_LABELS[level])}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-0.5">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
          {t("diet")}
        </legend>
        {DIET_OPTIONS.map((option) => (
          <CheckboxRow
            key={option}
            id={`diet-${option}`}
            checked={current.get("diet") === option}
            onCheckedChange={(checked) => setParam("diet", checked ? option : null)}
            label={t(DIET_LABELS[option])}
          />
        ))}
      </fieldset>

      {activeCount > 0 ? (
        <Button variant="outline" size="sm" className="w-full" onClick={clearAll}>
          <X aria-hidden />
          {tr("clearFilters")}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Result count plus the mobile-only "open filters" trigger. On small screens
 * the panel becomes a drag-to-dismiss bottom sheet (§6, §22.2); from `lg` up it
 * lives permanently in the sidebar rendered by the page.
 */
export function RecipeFilterToolbar({
  categories,
  resultCount,
  activeCount,
}: {
  categories: Category[];
  resultCount: number;
  activeCount: number;
}) {
  const tr = useTranslations("recipes");
  const tc = useTranslations("common");
  const { isPending } = useRecipeFilters();
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-fg-muted" aria-live="polite" aria-busy={isPending || undefined}>
        {tr("resultCount", { count: resultCount })}
      </p>

      <div className="flex items-center gap-2">
        {activeCount > 0 ? (
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-fg-brand">
            {tr("activeFilters")}: {activeCount}
          </span>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="lg:hidden"
        >
          <SlidersHorizontal aria-hidden />
          {tr("openFilters")}
        </Button>
      </div>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={tr("filters")}
        footer={
          <Button className="w-full" onClick={() => setOpen(false)}>
            {tc("seeAll")} ({resultCount})
          </Button>
        }
      >
        <RecipeFilterPanel categories={categories} />
      </BottomSheet>
    </div>
  );
}

function chipClass(active: boolean): string {
  return cn(
    "rounded-[10px] border px-3 py-2 text-xs font-medium",
    "transition-[background-color,border-color,color] duration-[var(--duration-fast)]",
    "active:scale-[0.97]",
    active
      ? "border-brand bg-brand-soft text-fg-brand"
      : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
  );
}
