import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { IngredientFinder } from "@/components/find/ingredient-finder";
import { SkeletonCardGrid } from "@/components/shared";
import { routing, type Locale } from "@/i18n/routing";
import { ingredientsApi } from "@/lib/api/catalog";
import { readOrPrerenderEmpty } from "@/lib/api/build-safety";
import type { Ingredient, IngredientCategory } from "@/types";

type Params = { params: Promise<{ locale: Locale }> };

/** The catalog is stable seed data, so it revalidates hourly. */
const REVALIDATE = 3600;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "find" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: `/${locale}/find-by-ingredients` },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function FindByIngredientsPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [ingredients, categories] = await Promise.all([
    readOrPrerenderEmpty<Ingredient[]>(
      () => ingredientsApi.list({}, { locale, next: { revalidate: REVALIDATE } }),
      [],
    ),
    readOrPrerenderEmpty<IngredientCategory[]>(
      () => ingredientsApi.categories({ locale, next: { revalidate: REVALIDATE } }),
      [],
    ),
  ]);

  return (
    // The selection lives in the query string, so the client component reads
    // `useSearchParams` and needs a Suspense boundary to stay prerenderable.
    <Suspense fallback={<FinderSkeleton />}>
      <IngredientFinder ingredients={ingredients} categories={categories} />
    </Suspense>
  );
}

function FinderSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-7 h-10 w-2/3 max-w-xl rounded-[10px] bg-surface-sunken" />
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-10">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 18 }, (_, index) => (
            <div key={index} className="h-9 w-28 rounded-full bg-surface-sunken" />
          ))}
        </div>
        <div className="h-56 rounded-[var(--radius-card)] border border-border bg-surface" />
      </div>
      <div className="mt-12">
        <SkeletonCardGrid count={4} />
      </div>
    </div>
  );
}
