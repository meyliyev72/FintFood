export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export type RecipeSummary = {
  id: number;
  title: string;
  slug: string;
  description: string;
  image: string | null;
  category: { id: number; name: string; slug: string } | null;
  cooking_time: number;
  prep_time: number;
  total_time: number;
  servings: number;
  difficulty: string;
  average_rating: number | null;
  review_count: number;
  ingredients_count: number;
};

export type RecipesPage = {
  count: number;
  total_pages: number;
  page: number;
  next: string | null;
  previous: string | null;
  results: RecipeSummary[];
};

export const REQUEST_TIMEOUT_MS = 8000;

export async function getRecipes(
  page = 1,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<RecipesPage> {
  const res = await fetch(`${API_URL}/recipes/?page=${page}`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`FintFood API returned ${res.status}`);
  }
  return (await res.json()) as RecipesPage;
}