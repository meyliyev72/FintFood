import { api, type RequestOptions } from "./client";
import type { Category, Ingredient, IngredientCategory } from "@/types";

type Ctx = Pick<RequestOptions, "locale" | "signal">;

/** Category list/detail. These endpoints are unpaginated. */
export const categoriesApi = {
  list: (ctx: Ctx = {}) => api.get<Category[]>("/categories/", ctx),
  detail: (slug: string, ctx: Ctx = {}) => api.get<Category>(`/categories/${slug}/`, ctx),
};

/** Ingredient catalog, also unpaginated (122 rows). */
export const ingredientsApi = {
  list: (params: { category?: string; search?: string } = {}, ctx: Ctx = {}) =>
    api.get<Ingredient[]>("/ingredients/", { ...ctx, query: { category: params.category, search: params.search } }),
  categories: (ctx: Ctx = {}) => api.get<IngredientCategory[]>("/ingredients/categories/", ctx),
};
