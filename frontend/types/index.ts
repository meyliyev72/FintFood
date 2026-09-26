/**
 * Types mirroring the Django REST API serializers.
 *
 * Keep these in sync with:
 *   backend/apps/accounts/serializers.py     UserSerializer
 *   backend/apps/categories/serializers.py   CategorySerializer
 *   backend/apps/ingredients/serializers.py  IngredientSerializer
 *   backend/apps/recipes/serializers.py      RecipeList/DetailSerializer
 *   backend/apps/favorites/serializers.py    FavoriteSerializer
 *   backend/apps/shopping_list/serializers.py ShoppingListItemSerializer
 *   backend/apps/reviews/serializers.py      ReviewSerializer
 */

export type Locale = "uz" | "ru" | "en";

export type Difficulty = "easy" | "medium" | "hard";

/** Raw `Unit` values accepted by the API on write. */
export type Unit = "g" | "kg" | "ml" | "l" | "pcs" | "tbsp" | "tsp";

/**
 * A unit as returned by read endpoints: already translated by the API via
 * `localized_choice("unit", ...)` and therefore a display label, not a raw
 * value (e.g. "шт" for "pcs").
 */
export type UnitLabel = string;

/** Matches `RecipeStatus` in backend/apps/recipes/models.py. */
export type RecipeStatus = "draft" | "pending" | "published" | "rejected";

/** Matches the `time_range` choices in backend/apps/recipes/filters.py. */
export type TimeRange = "under-15" | "15-30" | "30-60" | "60+";

/** Matches the `diet` filter in backend/apps/recipes/filters.py. */
export type Diet = "vegetarian" | "healthy" | "high-protein";

/** DRF page envelope from apps/core/pagination.StandardPagination. */
export interface Paginated<T> {
  count: number;
  total_pages: number;
  page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface User {
  id: number;
  email: string;
  name: string;
  display_name: string;
  avatar: string | null;
  bio: string;
  date_joined: string;
}

export interface Category {
  id: number;
  name: string;
  name_en: string;
  slug: string;
  description: string;
  image: string | null;
  recipe_count: number;
}

export interface IngredientCategory {
  id: number;
  name: string;
  name_en: string;
  slug: string;
}

export interface Ingredient {
  id: number;
  name: string;
  name_en: string;
  slug: string;
  category: IngredientCategory | null;
  category_id?: number | null;
}

export interface RecipeIngredient {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  quantity: string;
  /** Pre-localized display label, not a raw `Unit`. */
  unit: UnitLabel;
}

export interface InstructionStep {
  step_number: number;
  instruction: string;
  image: string | null;
}

export interface RecipeImage {
  id: number;
  url: string | null;
  alt: string;
}

export interface Recipe {
  id: number;
  title: string;
  slug: string;
  description: string;
  image: string | null;
  category: Category | null;
  author: User;
  cooking_time: number;
  prep_time: number;
  total_time: number;
  servings: number;
  /** Translated server-side via `localized_choice("difficulty", ...)`. */
  difficulty: string;
  average_rating: number | null;
  review_count: number;
  is_favorite: boolean;
  ingredients_count: number;
  created_at: string;

  /* Detail-only */
  ingredients?: RecipeIngredient[];
  steps?: InstructionStep[];
  images?: RecipeImage[];
  calories?: number | null;
  protein?: string | null;
  carbs?: string | null;
  fat?: string | null;
  reviews?: Review[];
}

/** Extra fields added by POST /recipes/match-by-ingredients/. */
export interface MatchedIngredient {
  id: number;
  name: string;
}

export interface MissingIngredient extends MatchedIngredient {
  quantity: string;
  unit: UnitLabel;
}

export interface RecipeMatch extends Recipe {
  matched_ingredients: MatchedIngredient[];
  missing_ingredients: MissingIngredient[];
  match_percentage: number;
  available_count: number;
  total_count: number;
}

export interface MatchResponse {
  selected_ingredients: string[];
  count: number;
  results: RecipeMatch[];
}

export interface ReviewUser {
  id: number;
  name: string;
  avatar: string | null;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user: ReviewUser;
}

export interface ReviewInput {
  recipe_id: number;
  rating: number;
  comment: string;
}

export interface Favorite {
  id: number;
  recipe: Recipe;
  created_at: string;
}

export interface FavoriteToggleResult {
  is_favorite: boolean;
  recipe_id: number;
}

export interface ShoppingListItem {
  id: number;
  name: string;
  ingredient_id: number | null;
  quantity: string;
  /** Pre-localized display label, not a raw `Unit`. */
  unit: UnitLabel;
  /** Localized server-side; falls back to a section header for free-text items. */
  category: string;
  is_completed: boolean;
  created_at: string;
}

export interface ShoppingListItemInput {
  name: string;
  ingredient_id?: number | null;
  quantity: string | number;
  unit: Unit;
  is_completed?: boolean;
}

export interface AddFromRecipeResponse {
  added: number;
  merged: number;
}

export interface AuthResponse {
  user: User;
}

/**
 * Query params accepted by GET /recipes/.
 *
 * Declared as a type alias rather than an interface so it satisfies
 * `Record<string, unknown>` and can be used directly as a React Query key.
 */
export type RecipeFilters = {
  category?: string;
  difficulty?: Difficulty;
  query?: string;
  max_time?: number;
  time_range?: TimeRange;
  diet?: Diet;
  ordering?: string;
  page?: number;
  page_size?: number;
};

/* -------------------------------------------------------------------------
 * Guards for URL-sourced values.
 *
 * Filter values come from the query string, so they must be validated before
 * they reach the API — a cast would let `?difficulty=bogus` through.
 * ---------------------------------------------------------------------- */

const DIFFICULTIES = ["easy", "medium", "hard"] as const satisfies readonly Difficulty[];
const TIME_RANGES = ["under-15", "15-30", "30-60", "60+"] as const satisfies readonly TimeRange[];
const DIETS = ["vegetarian", "healthy", "high-protein"] as const satisfies readonly Diet[];

function oneOf<T extends string>(values: readonly T[], value: string | undefined | null): T | undefined {
  return values.find((candidate) => candidate === value);
}

export const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === "string" && oneOf(DIFFICULTIES, value) !== undefined;

export const isTimeRange = (value: unknown): value is TimeRange =>
  typeof value === "string" && oneOf(TIME_RANGES, value) !== undefined;

export const isDiet = (value: unknown): value is Diet =>
  typeof value === "string" && oneOf(DIETS, value) !== undefined;

/** Reads a single, validated recipe filter out of a URLSearchParams. */
export function readRecipeFilters(params: URLSearchParams): RecipeFilters {
  const page = Number(params.get("page"));
  return {
    category: params.get("category") || undefined,
    difficulty: oneOf(DIFFICULTIES, params.get("difficulty")),
    time_range: oneOf(TIME_RANGES, params.get("time_range")),
    diet: oneOf(DIETS, params.get("diet")),
    query: params.get("query") || undefined,
    page: Number.isInteger(page) && page > 0 ? page : undefined,
  };
}

export interface DeleteResponse {
  deleted: number | boolean;
  slug?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}
