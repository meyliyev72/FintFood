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

/** Matches `Unit` in backend/apps/recipes/models.py. */
export type Unit = "g" | "kg" | "ml" | "l" | "pcs" | "tbsp" | "tsp";

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
  unit: Unit;
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
  /** Translated server-side via `get_difficulty_display`. */
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
  unit: Unit;
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
  unit: Unit;
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

/** Query params accepted by GET /recipes/. */
export interface RecipeFilters {
  category?: string;
  difficulty?: Difficulty;
  query?: string;
  max_time?: number;
  time_range?: TimeRange;
  diet?: Diet;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface DeleteResponse {
  deleted: number | boolean;
  slug?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}
