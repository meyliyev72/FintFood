import { getFormatter, getTranslations } from "next-intl/server";

import type { Recipe } from "@/types";

/**
 * Nutrition panel (§7).
 *
 * Rendered only when the recipe actually carries nutrition data. Fabricating
 * zeros or "unknown" rows would be worse than showing nothing, so if every
 * value is null the component returns null and the caller renders no heading.
 *
 * Values arrive from the API as `DecimalField` strings ("5.00"), and both the
 * numbers and the unit symbols are localized: grams come from `next-intl`'s
 * CLDR data ("g" / "г"), while kcal uses a translated abbreviation because
 * `Intl.NumberFormat` has no sanctioned calorie unit (§3.3).
 */
export async function NutritionPanel({
  recipe,
  className,
}: {
  recipe: Recipe;
  className?: string;
}) {
  const t = await getTranslations("recipe");
  const format = await getFormatter();

  const rows = [
    // `Intl.NumberFormat` has no sanctioned "calorie" unit, so the kcal
    // abbreviation comes from the message catalogue; grams do have one.
    { label: t("calories"), value: recipe.calories, digits: 0, suffix: ` ${t("unitKcal")}` },
    { label: t("protein"), value: recipe.protein, digits: 1, suffix: "" },
    { label: t("carbs"), value: recipe.carbs, digits: 1, suffix: "" },
    { label: t("fat"), value: recipe.fat, digits: 1, suffix: "" },
  ]
    .filter((row) => row.value != null && row.value !== "")
    .map((row) => {
      const amount = Number(row.value);
      const numeric = Number.isFinite(amount);
      return {
        label: row.label,
        display: numeric
          ? row.suffix
            ? `${format.number(amount, { maximumFractionDigits: row.digits })}${row.suffix}`
            : format.number(amount, {
                style: "unit",
                unit: "gram",
                unitDisplay: "short",
                maximumFractionDigits: row.digits,
              })
          : String(row.value),
      };
    });

  if (rows.length === 0) return null;

  return (
    <div className={className} role="group" aria-label={t("nutrition")}>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-[var(--radius-control)] border border-border bg-surface px-4 py-3"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
              {row.label}
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-fg">
              {row.display}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
