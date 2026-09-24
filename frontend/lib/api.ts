export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://fintfood-backend.onrender.com";

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
  const res = await fetch(`${API_URL}/api/v1/recipes/?page=${page}`, {
    next: { revalidate: 30 },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`FintFood API returned ${res.status}`);
  }
  return (await res.json()) as RecipesPage;
}