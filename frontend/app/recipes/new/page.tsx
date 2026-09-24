"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createRecipe,
  errorMessage,
  getCategories,
  type Category,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  Field,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";

const UNITS = ["pcs", "g", "kg", "ml", "l", "tbsp", "tsp", "cup", "clove", "bunch", "slice", "pack", "can"];

type IngredientRow = { name: string; quantity: string; unit: string };
type StepRow = { instruction: string };

export default function NewRecipePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cookingTime, setCookingTime] = useState("30");
  const [prepTime, setPrepTime] = useState("10");
  const [servings, setServings] = useState("2");
  const [difficulty, setDifficulty] = useState("medium");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: "", quantity: "1", unit: "pcs" },
  ]);
  const [steps, setSteps] = useState<StepRow[]>([{ instruction: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  function updateIngredient(index: number, patch: Partial<IngredientRow>) {
    setIngredients((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function updateStep(index: number, instruction: string) {
    setSteps((prev) =>
      prev.map((row, i) => (i === index ? { instruction } : row)),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const cleanIngredients = ingredients
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        quantity: row.quantity || "1",
        unit: row.unit,
      }));
    const cleanSteps = steps
      .map((row, index) => ({
        step_number: index + 1,
        instruction: row.instruction.trim(),
      }))
      .filter((row) => row.instruction);

    if (!title.trim() || title.trim().length < 3) {
      setError("Please enter a title of at least 3 characters.");
      return;
    }
    if (cleanIngredients.length === 0) {
      setError("Add at least one ingredient.");
      return;
    }
    if (cleanSteps.length === 0) {
      setError("Add at least one instruction step.");
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      cooking_time: Number(cookingTime),
      prep_time: Number(prepTime),
      servings: Number(servings),
      difficulty,
      ingredients: cleanIngredients,
      steps: cleanSteps,
    };
    if (categoryId) payload.category_id = Number(categoryId);
    if (calories) payload.calories = Number(calories);
    if (protein) payload.protein = protein;
    if (carbs) payload.carbs = carbs;
    if (fat) payload.fat = fat;

    setBusy(true);
    try {
      const created = await createRecipe(payload);
      router.push(`/recipe/?slug=${encodeURIComponent(created.slug)}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <LoadingState label="Loading…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Log in to add a recipe"
          action={<ButtonLink href="/login">Log in</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader title="Add a recipe" subtitle="Share something you love to cook." />

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <Field label="Title" htmlFor="title">
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Creamy Garlic Pasta"
            />
          </Field>
          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A short summary of the dish."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="category">
              <Select
                id="category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Difficulty" htmlFor="difficulty">
              <Select
                id="difficulty"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
            </Field>
            <Field label="Prep time (min)" htmlFor="prep">
              <Input
                id="prep"
                type="number"
                min="0"
                value={prepTime}
                onChange={(event) => setPrepTime(event.target.value)}
              />
            </Field>
            <Field label="Cooking time (min)" htmlFor="cook">
              <Input
                id="cook"
                type="number"
                min="1"
                value={cookingTime}
                onChange={(event) => setCookingTime(event.target.value)}
              />
            </Field>
            <Field label="Servings" htmlFor="servings">
              <Input
                id="servings"
                type="number"
                min="1"
                value={servings}
                onChange={(event) => setServings(event.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Ingredients</h2>
          <div className="mt-4 space-y-3">
            {ingredients.map((row, index) => (
              <div
                key={index}
                className="grid gap-2 sm:grid-cols-[1fr_100px_110px_auto]"
              >
                <Input
                  placeholder="Ingredient"
                  value={row.name}
                  onChange={(event) =>
                    updateIngredient(index, { name: event.target.value })
                  }
                />
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={row.quantity}
                  onChange={(event) =>
                    updateIngredient(index, { quantity: event.target.value })
                  }
                />
                <Select
                  value={row.unit}
                  onChange={(event) =>
                    updateIngredient(index, { unit: event.target.value })
                  }
                >
                  {UNITS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setIngredients((prev) =>
                      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
                    )
                  }
                  aria-label="Remove ingredient"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setIngredients((prev) => [
                  ...prev,
                  { name: "", quantity: "1", unit: "pcs" },
                ])
              }
            >
              + Add ingredient
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Instructions</h2>
          <div className="mt-4 space-y-3">
            {steps.map((row, index) => (
              <div key={index} className="flex gap-2">
                <span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                  {index + 1}
                </span>
                <Textarea
                  rows={2}
                  placeholder={`Step ${index + 1}`}
                  value={row.instruction}
                  onChange={(event) => updateStep(index, event.target.value)}
                />
                <Button
                  variant="ghost"
                  onClick={() =>
                    setSteps((prev) =>
                      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
                    )
                  }
                  aria-label="Remove step"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSteps((prev) => [...prev, { instruction: "" }])}
            >
              + Add step
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Nutrition (optional)</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <Field label="Calories" htmlFor="calories">
              <Input
                id="calories"
                type="number"
                min="0"
                value={calories}
                onChange={(event) => setCalories(event.target.value)}
              />
            </Field>
            <Field label="Protein (g)" htmlFor="protein">
              <Input
                id="protein"
                type="number"
                min="0"
                step="0.1"
                value={protein}
                onChange={(event) => setProtein(event.target.value)}
              />
            </Field>
            <Field label="Carbs (g)" htmlFor="carbs">
              <Input
                id="carbs"
                type="number"
                min="0"
                step="0.1"
                value={carbs}
                onChange={(event) => setCarbs(event.target.value)}
              />
            </Field>
            <Field label="Fat (g)" htmlFor="fat">
              <Input
                id="fat"
                type="number"
                min="0"
                step="0.1"
                value={fat}
                onChange={(event) => setFat(event.target.value)}
              />
            </Field>
          </div>
        </section>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? "Publishing…" : "Publish recipe"}
          </Button>
          <ButtonLink href="/profile" variant="secondary" size="lg">
            Cancel
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}
