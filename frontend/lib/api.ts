export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export const REQUEST_TIMEOUT_MS = 10000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type User = {
  id: number;
  email: string;
  name: string;
  display_name: string;
  avatar: string | null;
  bio: string;
  date_joined: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  recipe_count: number;
};

export type IngredientCategory = { id: number; name: string; slug: string };

export type Ingredient = {
  id: number;
  name: string;
  slug: string;
  category: IngredientCategory | null;
};

export type RecipeAuthor = {
  id: number;
  email: string;
  name: string;
  display_name: string;
  avatar: string | null;
  bio: string;
};

export type RecipeSummary = {
  id: number;
  title: string;
  slug: string;
  description: string;
  image: string | null;
  category: Category | null;
  author: RecipeAuthor;
  cooking_time: number;
  prep_time: number;
  total_time: number;
  servings: number;
  difficulty: string;
  average_rating: number | null;
  review_count: number;
  is_favorite: boolean;
  ingredients_count: number;
  created_at: string;
};

export type RecipeIngredient = {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  quantity: string;
  unit: string;
};

export type InstructionStep = {
  step_number: number;
  instruction: string;
  image: string | null;
};

export type RecipeImage = { id: number; url: string | null; alt: string };

export type Review = {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user: { id: number; name: string; avatar: string | null };
};

export type RecipeDetail = RecipeSummary & {
  ingredients: RecipeIngredient[];
  steps: InstructionStep[];
  images: RecipeImage[];
  calories: number | null;
  protein: string | null;
  carbs: string | null;
  fat: string | null;
  reviews: Review[];
};

export type Paginated<T> = {
  count: number;
  total_pages: number;
  page: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type RecipesPage = Paginated<RecipeSummary>;

export type MatchResult = RecipeSummary & {
  matched_ingredients: { id: number; name: string }[];
  missing_ingredients: {
    id: number;
    name: string;
    quantity: string;
    unit: string;
  }[];
  match_percentage: number;
  available_count: number;
  total_count: number;
};

export type MatchResponse = {
  selected_ingredients: string[];
  count: number;
  results: MatchResult[];
};

export type Favorite = { id: number; recipe: RecipeSummary; created_at: string };

export type ShoppingItem = {
  id: number;
  name: string;
  ingredient_id: number | null;
  quantity: string;
  unit: string;
  category: string | null;
  is_completed: boolean;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function extractMessage(data: unknown): string {
  if (data == null) return "Something went wrong. Please try again.";
  if (typeof data === "string") return data;
  if (typeof data !== "object") return String(data);
  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    const text = Array.isArray(value) ? value.join(" ") : String(value);
    parts.push(key === "non_field_errors" ? text : `${key}: ${text}`);
  }
  return parts.join("\n") || "Something went wrong. Please try again.";
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, timeoutMs = REQUEST_TIMEOUT_MS } = options;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new ApiError(0, "The FintFood API is not responding right now.", null);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, extractMessage(data), data);
  }
  return data as T;
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

export type RecipeQuery = {
  page?: number;
  page_size?: number;
  category?: string;
  difficulty?: string;
  query?: string;
  time_range?: string;
  diet?: string;
  ordering?: string;
};

export function getRecipes(
  params: RecipeQuery = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<RecipesPage> {
  return request<RecipesPage>(`/recipes/${buildQuery(params)}`, { timeoutMs });
}

export function getRecipe(slug: string): Promise<RecipeDetail> {
  return request<RecipeDetail>(`/recipes/${encodeURIComponent(slug)}/`);
}

export function getMyRecipes(page = 1): Promise<RecipesPage> {
  return request<RecipesPage>(`/recipes/my/${buildQuery({ page })}`);
}

export function getRecentlyViewed(): Promise<{ count: number; results: RecipeSummary[] }> {
  return request(`/recipes/recently_viewed/`);
}

export function createRecipe(data: unknown): Promise<RecipeDetail> {
  return request<RecipeDetail>(`/recipes/`, { method: "POST", body: data });
}

export function updateRecipe(slug: string, data: unknown): Promise<RecipeDetail> {
  return request<RecipeDetail>(`/recipes/${encodeURIComponent(slug)}/`, {
    method: "PATCH",
    body: data,
  });
}

export function deleteRecipe(slug: string): Promise<{ detail: string }> {
  return request(`/recipes/${encodeURIComponent(slug)}/`, { method: "DELETE" });
}

export function matchByIngredients(ingredientIds: number[]): Promise<MatchResponse> {
  return request<MatchResponse>(`/recipes/match-by-ingredients/`, {
    method: "POST",
    body: { ingredient_ids: ingredientIds },
  });
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export function getCategories(): Promise<Category[]> {
  return request<Category[]>(`/categories/`);
}

export function getIngredients(params: { search?: string; category?: string } = {}): Promise<
  Ingredient[]
> {
  return request<Ingredient[]>(`/ingredients/${buildQuery(params)}`);
}

export function getIngredientCategories(): Promise<IngredientCategory[]> {
  return request<IngredientCategory[]>(`/ingredients/categories/`);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type AuthResponse = { user: User };

export function register(data: {
  name?: string;
  email: string;
  password: string;
  password2: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>(`/auth/register/`, { method: "POST", body: data });
}

export function login(data: { email: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>(`/auth/login/`, { method: "POST", body: data });
}

export function logout(): Promise<{ detail: string }> {
  return request(`/auth/logout/`, { method: "POST" });
}

export function getMe(): Promise<User> {
  return request<User>(`/auth/me/`);
}

export function updateMe(data: Partial<Pick<User, "name" | "bio">>): Promise<User> {
  return request<User>(`/auth/me/`, { method: "PATCH", body: data });
}

export function changePassword(data: {
  old_password: string;
  new_password: string;
  password2: string;
}): Promise<{ detail: string }> {
  return request(`/auth/password/change/`, { method: "POST", body: data });
}

export function requestPasswordReset(email: string): Promise<{ detail: string }> {
  return request(`/auth/password/reset/`, { method: "POST", body: { email } });
}

export function confirmPasswordReset(data: {
  uid: string;
  token: string;
  new_password: string;
}): Promise<{ detail: string }> {
  return request(`/auth/password/reset/confirm/`, { method: "POST", body: data });
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export function getFavorites(): Promise<Paginated<Favorite>> {
  return request<Paginated<Favorite>>(`/favorites/`);
}

export function toggleFavorite(recipeId: number): Promise<{ is_favorite: boolean; recipe_id: number }> {
  return request(`/favorites/toggle/`, { method: "POST", body: { recipe_id: recipeId } });
}

export function getFavoriteIds(): Promise<{ recipe_ids: number[] }> {
  return request(`/favorites/ids/`);
}

// ---------------------------------------------------------------------------
// Shopping list
// ---------------------------------------------------------------------------

export function getShoppingList(): Promise<Paginated<ShoppingItem>> {
  return request<Paginated<ShoppingItem>>(`/shopping-list/`);
}

export function addShoppingItem(data: {
  name: string;
  quantity: number | string;
  unit?: string;
  ingredient_id?: number | null;
}): Promise<ShoppingItem> {
  return request<ShoppingItem>(`/shopping-list/`, { method: "POST", body: data });
}

export function updateShoppingItem(
  id: number,
  data: Partial<Pick<ShoppingItem, "is_completed" | "quantity" | "unit" | "name">>,
): Promise<ShoppingItem> {
  return request<ShoppingItem>(`/shopping-list/${id}/`, { method: "PATCH", body: data });
}

export function deleteShoppingItem(id: number): Promise<{ detail: string }> {
  return request(`/shopping-list/${id}/`, { method: "DELETE" });
}

export function addFromRecipe(
  recipeId: number,
  ingredientIds?: number[],
): Promise<{ detail: string }> {
  return request(`/shopping-list/add-from-recipe/`, {
    method: "POST",
    body: { recipe_id: recipeId, ingredient_ids: ingredientIds },
  });
}

export function clearCompleted(): Promise<{ detail: string }> {
  return request(`/shopping-list/clear-completed/`, { method: "POST" });
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export function createReview(data: {
  recipe_id: number;
  rating: number;
  comment: string;
}): Promise<Review> {
  return request<Review>(`/reviews/`, { method: "POST", body: data });
}

export function deleteReview(id: number): Promise<{ detail: string }> {
  return request(`/reviews/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function getHealth(): Promise<{ status: string; service: string }> {
  return request(`/health/`);
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
