import { api, type RequestOptions } from "./client";
import type {
  AddFromRecipeResponse,
  DeleteResponse,
  Favorite,
  FavoriteToggleResult,
  Paginated,
  Review,
  ReviewInput,
  ShoppingListItem,
  ShoppingListItemInput,
} from "@/types";

type Ctx = Pick<RequestOptions, "locale" | "signal">;

export const favoritesApi = {
  list: (page = 1, ctx: Ctx = {}) =>
    api.get<Paginated<Favorite>>("/favorites/", { ...ctx, query: { page } }),

  /** Only the ids — cheaper than the full list for hydrating heart buttons. */
  ids: (ctx: Ctx = {}) => api.get<{ recipe_ids: number[] }>("/favorites/ids/", ctx),

  /** Flips the favorite state and returns the new state. */
  toggle: (recipeId: number, ctx: Ctx = {}) =>
    api.post<FavoriteToggleResult>("/favorites/toggle/", { recipe_id: recipeId }, ctx),

  remove: (id: number, ctx: Ctx = {}) => api.delete<unknown>(`/favorites/${id}/`, ctx),
};

export const shoppingListApi = {
  list: (ctx: Ctx = {}) => api.get<ShoppingListItem[]>("/shopping-list/", ctx),

  /** Creates or merges into an existing item with the same name. */
  add: (input: ShoppingListItemInput, ctx: Ctx = {}) =>
    api.post<ShoppingListItem>("/shopping-list/", input, ctx),

  update: (id: number, input: Partial<ShoppingListItemInput>, ctx: Ctx = {}) =>
    api.patch<ShoppingListItem>(`/shopping-list/${id}/`, input, ctx),

  remove: (id: number, ctx: Ctx = {}) => api.delete<DeleteResponse>(`/shopping-list/${id}/`, ctx),

  /** Bulk-adds a recipe's ingredients; optionally a subset by ingredient id. */
  addFromRecipe: (recipeId: number, ingredientIds?: number[], ctx: Ctx = {}) =>
    api.post<AddFromRecipeResponse>(
      "/shopping-list/add-from-recipe/",
      { recipe_id: recipeId, ingredient_ids: ingredientIds },
      ctx,
    ),

  clearCompleted: (ctx: Ctx = {}) =>
    api.post<{ deleted: number }>("/shopping-list/clear-completed/", undefined, ctx),
};

export const reviewsApi = {
  /** Creates or updates the signed-in user's review for the recipe. */
  submit: (input: ReviewInput, ctx: Ctx = {}) => api.post<Review>("/reviews/", input, ctx),

  update: (id: number, input: Partial<ReviewInput>, ctx: Ctx = {}) =>
    api.patch<Review>(`/reviews/${id}/`, input, ctx),

  remove: (id: number, ctx: Ctx = {}) => api.delete<DeleteResponse>(`/reviews/${id}/`, ctx),

  listForRecipe: (recipeId: number, ctx: Ctx = {}) =>
    api.get<Paginated<Review>>("/reviews/", { ...ctx, query: { recipe: recipeId } }),
};
