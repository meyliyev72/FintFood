import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CategoryCard } from "@/components/home/category-card";
import { RevealSection } from "@/components/shared";
import { EmptyState } from "@/components/ui";
import { routing, type Locale } from "@/i18n/routing";
import { categoriesApi } from "@/lib/api/catalog";
import { readOrPrerenderEmpty } from "@/lib/api/build-safety";
import type { Category } from "@/types";

type Params = { params: Promise<{ locale: Locale }> };

/** Catalog page: long cache, it only changes when an admin adds a category. */
const REVALIDATE = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "categories" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `/${locale}/categories`,
      languages: Object.fromEntries(
        routing.locales.map((code) => [code, `/${code}/categories`]),
      ),
    },
  };
}

export default async function CategoriesPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [categories, t] = await Promise.all([
    readOrPrerenderEmpty<Category[]>(
      () => categoriesApi.list({ locale, next: { revalidate: REVALIDATE } }),
      [],
    ),
    getTranslations({ locale, namespace: "categories" }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-fg-muted">{t("subtitle")}</p>
      </header>

      {categories.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <RevealSection>
          <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category, index) => (
              <li key={category.id} className="flex">
                <CategoryCard category={category} priority={index < 4} className="w-full" />
              </li>
            ))}
          </ul>
        </RevealSection>
      )}
    </div>
  );
}
