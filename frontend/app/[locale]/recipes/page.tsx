import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { RecipeBrowser } from "@/components/recipe/recipe-browser";
import { recipesApi, categoriesApi } from "@/lib/api";
import { routing, type Locale } from "@/i18n/routing";
import { readRecipeFilters } from "@/types";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Public, cacheable page: revalidate the first page every 5 minutes (§3.2). */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recipes" });
  const tc = await getTranslations({ locale, namespace: "common" });

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `/${locale}/recipes`,
      languages: Object.fromEntries(
        routing.locales.map((code) => [code, `/${code}/recipes`]),
      ),
    },
    openGraph: {
      title: `${t("title")} | ${tc("appName")}`,
      description: t("subtitle"),
      locale,
      type: "website",
    },
  };
}

/**
 * Rendered on the server so the first page of results is in the HTML.
 * Revalidated every 5 minutes, and re-fetched on navigation.
 */
export default async function RecipesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  // Validate the URL-sourced filters rather than forwarding them blindly.
  const filters = readRecipeFilters(new URLSearchParams(toQueryString(query)));

  const [initialPage, categories] = await Promise.all([
    recipesApi.list(filters, { locale }),
    categoriesApi.list({ locale }),
  ]);

  return <RecipeBrowser categories={categories} initialPage={initialPage} />;
}

function toQueryString(query: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single) params.set(key, single);
  }
  return params.toString();
}
