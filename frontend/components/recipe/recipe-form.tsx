"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/form";
import { useFormMessages } from "@/hooks/use-form-messages";
import { ApiError } from "@/lib/api/client";
import { ingredientsApi } from "@/lib/api/catalog";
import { recipesApi } from "@/lib/api/recipes";
import {
  DIFFICULTIES,
  RECIPE_STATUSES,
  UNITS,
  recipeSchema,
  type FormMessages,
} from "@/lib/validators";
import { cn } from "@/lib/utils";
import type { DifficultyCode, Recipe, Unit } from "@/types";

/* Matches `validate_uploaded_image` on the server, so the obvious mistakes are
 * caught before the upload rather than after. */
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** The schema's input/output pair: `status` has a default and the nutrition
 * fields are `nullish`, so what the form holds and what the resolver hands back
 * are not the same type. */
type FormSchema = ReturnType<typeof recipeSchema>;
type FormInput = z.input<FormSchema>;
type FormOutput = z.output<FormSchema>;

/**
 * Recipe create/edit form (Â§12, Â§13).
 *
 * Shared by both pages: the only differences are the heading, the submit label,
 * the seeded values and whether the delete action is offered. Validation goes
 * through `recipeSchema` so the browser and DRF agree on the rules, and server
 * field errors are re-rendered with this page's own localized copy rather than
 * DRF's default (which ships in one language only).
 */
export function RecipeForm({
  mode,
  recipe,
  categories,
  onSaved,
  onDelete,
  deleting,
}: {
  mode: "create" | "edit";
  /** Present in edit mode; seeds every field. */
  recipe?: Recipe;
  /** Pre-loaded on the server so the page renders without a client fetch. */
  categories: { id: number; name: string }[];
  onSaved: (recipe: Recipe) => void;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const t = useTranslations("recipeForm");
  const tr = useTranslations("recipe");
  const tc = useTranslations("common");
  const tu = useTranslations("unit");
  const td = useTranslations("difficulty");
  const te = useTranslations("errors");
  const messages = useFormMessages();

  const fileRef = useRef<HTMLInputElement>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Suggestion list for ingredient names. Free text is still allowed: the
  // server resolves known names to catalog rows and creates new ones otherwise.
  const catalog = useQuery({
    queryKey: ["ingredients", "form-names"],
    queryFn: () => ingredientsApi.list(),
    staleTime: 60 * 60 * 1000,
  });

  const schema = recipeSchema(messages);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      title: recipe?.title ?? "",
      description: recipe?.description ?? "",
      category_id: recipe?.category?.id ?? 0,
      cooking_time: recipe?.cooking_time ?? 30,
      prep_time: recipe?.prep_time ?? 15,
      servings: recipe?.servings ?? 4,
      difficulty: (recipe?.difficulty_code ?? "easy") as DifficultyCode,      status: "published",
      calories: recipe?.calories ?? null,
      protein: toNumber(recipe?.protein),
      carbs: toNumber(recipe?.carbs),
      fat: toNumber(recipe?.fat),
      ingredients: recipe?.ingredients?.map(toIngredientRow) ?? [
        { ingredient_id: null, name: "", quantity: 1, unit: "pcs" },
      ],
      steps: recipe?.steps?.map((step) => ({ instruction: step.instruction })) ?? [
        { instruction: "" },
      ],
    },
  });

  const ingredients = useFieldArray({ control: form.control, name: "ingredients" });
  const steps = useFieldArray({ control: form.control, name: "steps" });

  // `useWatch` rather than `watch()` inside the row map: it is memoizable, so
  // the React Compiler will not bail out of the list (��19).
  const watchedIngredients = useWatch({ control: form.control, name: "ingredients" });

  const names = catalog.data?.map((item) => item.name) ?? [];

  function pickCover(file: File | null) {
    setCoverError(null);
    if (!file) {
      setCover(null);
      return;
    }
    if (!COVER_TYPES.includes(file.type)) {
      setCover(null);
      setCoverError(t("coverHint"));
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setCover(null);
      setCoverError(t("coverHint"));
      return;
    }
    setCover(file);
  }

  async function onSubmit(values: FormOutput) {
    setSubmitError(null);
    try {
      const input = {
        title: values.title,
        description: values.description,
        category_id: values.category_id || null,
        cooking_time: values.cooking_time,
        prep_time: values.prep_time,
        servings: values.servings,
        difficulty: values.difficulty,
        status: values.status,
        calories: values.calories ?? null,
        protein: values.protein ?? null,
        carbs: values.carbs ?? null,
        fat: values.fat ?? null,
        ingredients: values.ingredients.map((row) => ({
          ingredient_id: row.ingredient_id ?? null,
          name: row.name,
          quantity: row.quantity,
          unit: row.unit,
        })),
        steps: values.steps.map((step, index) => ({
          step_number: index + 1,
          instruction: step.instruction,
        })),
        cover_image: cover,
      };

      const saved =
        mode === "edit" && recipe
          ? await recipesApi.update(recipe.slug, input)
          : await recipesApi.create(input);

      toast.success(mode === "edit" ? t("updated") : t("created"));
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError && error.fields && Object.keys(error.fields).length) {
        applyServerErrors(form.setError, error.fields, messages);
        setSubmitError(te("validation"));
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setSubmitError(t("notOwner"));
        return;
      }
      setSubmitError(te("saveFailed"));
    }
  }

  const busy = form.formState.isSubmitting;
  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <FormAlert message={submitError} />

      {/* ---------------------------------------------------------------- */}
      {/* Basics                                                            */}
      {/* ---------------------------------------------------------------- */}
      <Section title={t("sectionBasics")}>
        <Field label={t("title")} required error={errors.title?.message}>
          <Input
            {...form.register("title")}
            placeholder={t("titlePlaceholder")}
            maxLength={200}
            autoComplete="off"
          />
        </Field>

        <Field label={t("description")} required error={errors.description?.message}>
          <Textarea
            {...form.register("description")}
            placeholder={t("descriptionPlaceholder")}
            maxLength={4000}
            className="min-h-28"
          />
        </Field>

        <Field label={t("category")} required error={errors.category_id?.message}>
          <Select
            {...form.register("category_id", { valueAsNumber: true })}
            placeholder={t("categoryPlaceholder")}
            options={categories.map((category) => ({
              value: String(category.id),
              label: category.name,
            }))}
          />
        </Field>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Timing                                                            */}
      {/* ---------------------------------------------------------------- */}
      <Section title={t("sectionTiming")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("prepTime")} required error={errors.prep_time?.message}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              className="tabular-nums"
              {...form.register("prep_time", { valueAsNumber: true })}
            />
          </Field>
          <Field label={t("cookTime")} required error={errors.cooking_time?.message}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              className="tabular-nums"
              {...form.register("cooking_time", { valueAsNumber: true })}
            />
          </Field>
          <Field label={t("servings")} required error={errors.servings?.message}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              className="tabular-nums"
              {...form.register("servings", { valueAsNumber: true })}
            />
          </Field>
          <Field label={t("difficulty")} required error={errors.difficulty?.message}>
            <Select
              {...form.register("difficulty")}
              options={DIFFICULTIES.map((value) => ({ value, label: td(value) }))}
            />
          </Field>
        </div>

        {mode === "edit" ? (
          <Field label={t("status")} error={errors.status?.message}>
            <Select
              {...form.register("status")}
              options={RECIPE_STATUSES.map((value) => ({
                value,
                label: t(`status${capitalize(value)}` as "statusDraft"),
              }))}
              className="sm:max-w-xs"
            />
          </Field>
        ) : null}
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Cover image                                                       */}
      {/* ---------------------------------------------------------------- */}
      <Section title={t("sectionMedia")}>
        <Field label={t("cover")} hint={t("coverHint")} error={coverError ?? undefined}>
          <div className="flex flex-wrap items-center gap-3">
            {cover || recipe?.image ? (
              <span className="relative size-20 overflow-hidden rounded-[var(--radius-control)] border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover ? URL.createObjectURL(cover) : (recipe?.image ?? "")}
                  alt=""
                  className="size-full object-cover"
                />
                {cover ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCover(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-surface/90 text-fg shadow-sm"
                    aria-label={t("coverRemove")}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                ) : null}
              </span>
            ) : null}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => pickCover(event.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="size-4" aria-hidden />
              {cover ? t("coverChange") : t("coverChoose")}
            </Button>
            {recipe?.image && !cover ? (
              <span className="text-xs text-fg-subtle">{t("currentCover")}</span>
            ) : null}
          </div>
        </Field>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Ingredients                                                       */}
      {/* ---------------------------------------------------------------- */}
      <Section title={t("sectionIngredients")}>
        <ul className="space-y-3">
          {ingredients.fields.map((field, index) => {
            const rowErrors = errors.ingredients?.[index];
            const label = watchedIngredients?.[index]?.name;
            return (
              <li
                key={field.id}
                className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_6.5rem_8rem_auto] sm:items-start"
              >
                <Field label={index === 0 ? t("ingredientName") : undefined} error={rowErrors?.name?.message}>
                  <Input
                    list="recipe-ingredient-names"
                    autoComplete="off"
                    placeholder={t("ingredientPlaceholder")}
                    {...form.register(`ingredients.${index}.name`)}
                  />
                </Field>
                <Field label={index === 0 ? t("quantity") : undefined} error={rowErrors?.quantity?.message}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    className="tabular-nums"
                    {...form.register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
                  />
                </Field>
                <Field label={index === 0 ? t("unit") : undefined} error={rowErrors?.unit?.message}>
                  <Select
                    {...form.register(`ingredients.${index}.unit`)}
                    options={UNITS.map((value) => ({ value, label: tu(value) }))}
                  />
                </Field>
                <div className={cn("flex gap-1.5", "sm:pt-0", index === 0 && "sm:pt-7")}>
                  <IconButton
                    label={t("moveUp")}
                    disabled={index === 0}
                    onClick={() => ingredients.swap(index, index - 1)}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </IconButton>
                  <IconButton
                    label={t("moveDown")}
                    disabled={index === ingredients.fields.length - 1}
                    onClick={() => ingredients.swap(index, index + 1)}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </IconButton>
                  <IconButton
                    label={t("removeIngredient", { name: label || index + 1 })}
                    disabled={ingredients.fields.length === 1}
                    danger
                    onClick={() => ingredients.remove(index)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>

        <datalist id="recipe-ingredient-names">
          {names.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        {errors.ingredients && !Array.isArray(errors.ingredients) ? (
          <p role="alert" className="text-xs font-medium text-danger">
            {String((errors.ingredients as { message?: string }).message ?? "")}
          </p>
        ) : null}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => ingredients.append({ ingredient_id: null, name: "", quantity: 1, unit: "pcs" })}
        >
          <Plus className="size-4" aria-hidden />
          {t("addIngredient")}
        </Button>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Steps                                                             */}
      {/* ---------------------------------------------------------------- */}
      <Section title={t("sectionSteps")}>
        <ul className="space-y-3">
          {steps.fields.map((field, index) => {
            const rowErrors = errors.steps?.[index];
            return (
              <li
                key={field.id}
                className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start"
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <Field error={rowErrors?.instruction?.message}>
                  <Textarea
                    placeholder={t("stepPlaceholder")}
                    maxLength={2000}
                    className="min-h-20"
                    {...form.register(`steps.${index}.instruction`)}
                  />
                </Field>
                <div className="flex gap-1.5">
                  <IconButton
                    label={t("moveUp")}
                    disabled={index === 0}
                    onClick={() => steps.swap(index, index - 1)}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </IconButton>
                  <IconButton
                    label={t("moveDown")}
                    disabled={index === steps.fields.length - 1}
                    onClick={() => steps.swap(index, index + 1)}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </IconButton>
                  <IconButton
                    label={t("removeStep", { number: index + 1 })}
                    disabled={steps.fields.length === 1}
                    danger
                    onClick={() => steps.remove(index)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>

        {errors.steps && !Array.isArray(errors.steps) ? (
          <p role="alert" className="text-xs font-medium text-danger">
            {String((errors.steps as { message?: string }).message ?? "")}
          </p>
        ) : null}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => steps.append({ instruction: "" })}
        >
          <Plus className="size-4" aria-hidden />
          {t("addStep")}
        </Button>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Actions                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {mode === "edit" ? t("saveEdit") : t("saveCreate")}
        </Button>
        {mode === "edit" && onDelete ? (
          <Button type="button" variant="ghost" disabled={deleting} onClick={onDelete}>
            <Trash2 className="size-4" aria-hidden />
            {tr("deleteRecipe")}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={busy}>
          {tc("cancel")}
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                      */
/* -------------------------------------------------------------------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">{title}</h2>
      {children}
    </section>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] border border-border",
        "transition-colors duration-[var(--duration-fast)]",
        "hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40",
        danger && "text-danger hover:bg-danger-soft",
      )}
    >
      {children}
    </button>
  );
}

function toIngredientRow(item: NonNullable<Recipe["ingredients"]>[number]) {
  return {
    ingredient_id: item.id,
    name: item.name,
    quantity: toNumber(item.quantity) ?? 1,
    // `unit` is a translated label; `unit_code` is the raw key the API needs.
    unit: (item.unit_code ?? "pcs") as Unit,
  };
}

/** Decimal fields arrive as strings (`"300.00"`); the form works in numbers. */
function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Re-labels DRF field errors with this page's own copy.
 *
 * DRF's own messages are not translated (`USE_I18N` yields Uzbek text on every
 * locale), so they are used only to decide *which* field to highlight.
 */
function applyServerErrors(
  setError: (name: never, error: { message: string }) => void,
  fields: Record<string, string[] | undefined>,
  messages: FormMessages,
) {
  for (const [key, value] of Object.entries(fields)) {
    if (!Array.isArray(value) || !value.length) continue;
    const root = key.split(".")[0];
    if (root === "ingredients" || root === "steps") {
      setError(root as never, { message: messages.invalid });
      continue;
    }
    setError(key as never, { message: messages.invalid });
  }
}
