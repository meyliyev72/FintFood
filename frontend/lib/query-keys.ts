/**
 * Centralised TanStack Query keys.
 *
 * Keeping them here means an invalidation after a mutation can never drift
 * from the key a component subscribed to.
 */
export const queryKeys = {
  session: ["session"] as const,

  recipes: (filters: Readonly<object>) => ["recipes", "list", filters] as const,
  recipe: (slug: string) => ["recipes", "detail", slug] as const,
  myRecipes: (page: number) => ["recipes", "mine", page] as const,
  recentlyViewed: ["recipes", "recently-viewed"] as const,
  match: (ids: number[]) => ["recipes", "match", [...ids].sort((a, b) => a - b)] as const,

  categories: ["categories", "list"] as const,
  category: (slug: string) => ["categories", "detail", slug] as const,
  ingredients: ["ingredients", "list"] as const,
  ingredientCategories: ["ingredients", "categories"] as const,

  favorites: ["favorites", "list"] as const,
  favoriteIds: ["favorites", "ids"] as const,

  shoppingList: ["shopping-list"] as const,

  reviews: (recipeId: number) => ["reviews", "recipe", recipeId] as const,
} as const;
