import { api, type RequestOptions } from "./client";
import type {
  DeleteResponse,
  MatchResponse,
  Paginated,
  Recipe,
  RecipeFilters,
  RecipeMatch,
} from "@/types";

type Ctx = Pick<RequestOptions, "locale" | "signal">;

export interface RecipeWriteIngredient {
  ingredient_id?: number | null;
  name?: string;
  quantity: string | number;
  unit: string;
}

export interface RecipeWriteStep {
  step_number: number;
  instruction: string;
  image?: File | null;
}

export interface RecipeWriteInput {
  title: string;
  description: string;
  category_id?: number | null;
  cooking_time: number;
  prep_time: number;
  servings: number;
  difficulty: string;
  status?: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  ingredients: RecipeWriteIngredient[];
  steps: RecipeWriteStep[];
  extra_images?: File[];
  cover_image?: File | null;
}

/** Strips `undefined`/empty values so they never reach Django's filters. */
function toQuery(filters: RecipeFilters): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    query[key] = value as string | number;
  }
  return query;
}

export const recipesApi = {
  /** Paginated, filterable list. `page` is 1-based. */
  list: (filters: RecipeFilters = {}, ctx: Ctx = {}) =>
    api.get<Paginated<Recipe>>("/recipes/", { ...ctx, query: toQuery(filters) }),

  /** Paginated list of the signed-in author's recipes, all statuses. */
  mine: (page = 1, ctx: Ctx = {}) =>
    api.get<Paginated<Recipe>>("/recipes/my/", { ...ctx, query: { page } }),

  /** Up to 12 recently viewed recipes. */
  recentlyViewed: (ctx: Ctx = {}) =>
    api.get<{ count: number; results: Recipe[] }>("/recipes/recently_viewed/", ctx),

  detail: (slug: string, ctx: Ctx = {}) => api.get<Recipe>(`/recipes/${slug}/`, ctx),

  create: (input: RecipeWriteInput, ctx: Ctx = {}) => {
    const { cover_image, extra_images, ...rest } = input;
    const payload = new FormData();
    payload.set("title", rest.title);
    payload.set("description", rest.description);
    payload.set("cooking_time", String(rest.cooking_time));
    payload.set("prep_time", String(rest.prep_time));
    payload.set("servings", String(rest.servings));
    payload.set("difficulty", rest.difficulty);
    if (rest.category_id) payload.set("category_id", String(rest.category_id));
    if (rest.status) payload.set("status", rest.status);
    if (rest.calories != null) payload.set("calories", String(rest.calories));
    if (rest.protein != null) payload.set("protein", String(rest.protein));
    if (rest.carbs != null) payload.set("carbs", String(rest.carbs));
    if (rest.fat != null) payload.set("fat", String(rest.fat));
    if (cover_image) payload.set("cover_image", cover_image);
    rest.ingredients.forEach((item, index) => {
      payload.set(`ingredients[${index}][quantity]`, String(item.quantity));
      payload.set(`ingredients[${index}][unit]`, item.unit);
      if (item.ingredient_id) payload.set(`ingredients[${index}][ingredient_id]`, String(item.ingredient_id));
      else if (item.name) payload.set(`ingredients[${index}][name]`, item.name);
    });
    rest.steps.forEach((step, index) => {
      payload.set(`steps[${index}][step_number]`, String(step.step_number));
      payload.set(`steps[${index}][instruction]`, step.instruction);
      if (step.image) payload.set(`steps[${index}][image]`, step.image);
    });
    extra_images?.forEach((file) => payload.append("extra_images", file));
    return api.post<Recipe>("/recipes/", payload, ctx);
  },

  update: (slug: string, input: RecipeWriteInput, ctx: Ctx = {}) => {
    const { cover_image, extra_images, ...rest } = input;
    const payload = new FormData();
    payload.set("title", rest.title);
    payload.set("description", rest.description);
    payload.set("cooking_time", String(rest.cooking_time));
    payload.set("prep_time", String(rest.prep_time));
    payload.set("servings", String(rest.servings));
    payload.set("difficulty", rest.difficulty);
    if (rest.category_id) payload.set("category_id", String(rest.category_id));
    if (rest.status) payload.set("status", rest.status);
    if (rest.calories != null) payload.set("calories", String(rest.calories));
    if (rest.protein != null) payload.set("protein", String(rest.protein));
    if (rest.carbs != null) payload.set("carbs", String(rest.carbs));
    if (rest.fat != null) payload.set("fat", String(rest.fat));
    if (cover_image) payload.set("cover_image", cover_image);
    rest.ingredients.forEach((item, index) => {
      payload.set(`ingredients[${index}][quantity]`, String(item.quantity));
      payload.set(`ingredients[${index}][unit]`, item.unit);
      if (item.ingredient_id) payload.set(`ingredients[${index}][ingredient_id]`, String(item.ingredient_id));
      else if (item.name) payload.set(`ingredients[${index}][name]`, item.name);
    });
    rest.steps.forEach((step, index) => {
      payload.set(`steps[${index}][step_number]`, String(step.step_number));
      payload.set(`steps[${index}][instruction]`, step.instruction);
      if (step.image) payload.set(`steps[${index}][image]`, step.image);
    });
    extra_images?.forEach((file) => payload.append("extra_images", file));
    return api.patch<Recipe>(`/recipes/${slug}/`, payload, ctx);
  },

  remove: (slug: string, ctx: Ctx = {}) =>
    api.delete<DeleteResponse>(`/recipes/${slug}/`, ctx),

  /**
   * Ranks published recipes by how many of `ingredientIds` they need.
   * Response is sorted by `match_percentage` then rating.
   */
  matchByIngredients: (ingredientIds: number[], ctx: Ctx = {}) =>
    api.post<MatchResponse>("/recipes/match-by-ingredients/", { ingredient_ids: ingredientIds }, ctx),

  /** Files a moderation report against a recipe or a review. */
  report: (
    input: { content_type: "recipe" | "review"; object_id: number; reason: string; detail?: string },
    ctx: Ctx = {},
  ) => api.post<unknown>("/reports/", input, ctx),
};

export type { RecipeMatch };
