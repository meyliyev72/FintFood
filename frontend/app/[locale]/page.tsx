import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { CategoryCard } from "@/components/home/category-card";
import { HomeHero } from "@/components/home/home-hero";
import {
  HomeIngredientFinder,
  RevealSection,
} from "@/components/home/home-ingredient-finder";
import { RecipeGrid } from "@/components/recipe/recipe-grid";
import { SectionHeader } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { categoriesApi, ingredientsApi, recipesApi } from "@/lib/api";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** The home page is fully public and cacheable; refresh it every 5 minutes. */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const tc = await getTranslations({ locale, namespace: "common" });

  return {
    title: `${tc("appName")} — ${t("heroTitle")}`,
    description: t("heroSubtitle"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((code) => [code, `/${code}`])),
    },
    openGraph: {
      title: `${tc("appName")} — ${t("heroTitle")}`,
      description: t("heroSubtitle"),
      locale,
      type: "website",
    },
  };
}

/** Recipes shown in each home rail. */
const RAIL_SIZE = 6;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const ctx = { locale };

  // Five independent reads; one round trip each, all in parallel.
  const [categories, popular, quick, uzbek, latest, catalog] = await Promise.all([
    categoriesApi.list(ctx),
    recipesApi.list({ ordering: "-avg_rating", page_size: RAIL_SIZE }, ctx),
    recipesApi.list({ max_time: 30, ordering: "total_time", page_size: RAIL_SIZE }, ctx),
    recipesApi.list({ category: "uzbek-cuisine", page_size: RAIL_SIZE }, ctx),
    recipesApi.list({ ordering: "-created_at", page_size: RAIL_SIZE }, ctx),
    ingredientsApi.list({}, ctx),
  ]);

  // The eight most-used ingredients make the best starter chips; both the list
  // and the ranking come from the API, never from hardcoded rows.
  const popularIngredients = [...catalog]
    .sort((a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0))
    .slice(0, 12);

  const heroImage = popular.results[0]?.image ?? latest.results[0]?.image ?? null;

  return (
    <>
      <HomeHero image={heroImage} />

      <HomeIngredientFinder
        popular={popularIngredients}
        background={latest.results[1]?.image ?? heroImage}
      />

      <RevealSection className="border-b border-border bg-surface-sunken">
        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
          <SectionHeader
            title={t("popularTitle")}
            description={t("popularSubtitle")}
            action={<SeeAll href="/recipes" />}
          />
          {popular.results.length > 0 ? (
            <RecipeGrid recipes={popular.results} />
          ) : null}
        </section>
      </RevealSection>

      <RevealSection>
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
            <SectionHeader
              title={t("categoriesTitle")}
              description={t("categoriesSubtitle")}
              action={<SeeAll href="/categories" />}
            />
            <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-3 lg:grid-cols-4">
              {categories.slice(0, 8).map((category, index) => (
                <li key={category.id} className="flex">
                  <CategoryCard category={category} priority={index < 4} className="w-full" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </RevealSection>

      <RevealSection className="border-b border-border bg-surface-sunken">
        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
          <SectionHeader
            title={t("quickTitle")}
            description={t("quickSubtitle")}
            action={<SeeAll href="/recipes?time_range=under-15" />}
          />
          {quick.results.length > 0 ? (
            <RecipeGrid recipes={quick.results} />
          ) : null}
        </section>
      </RevealSection>

      <RevealSection>
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
            <SectionHeader
              title={t("uzbekTitle")}
              description={t("uzbekSubtitle")}
              action={<SeeAll href="/categories/uzbek-cuisine" />}
            />
            {uzbek.results.length > 0 ? (
              <RecipeGrid recipes={uzbek.results} matchMode={false} />
            ) : null}
          </div>
        </section>
      </RevealSection>

      <RevealSection className="bg-surface-sunken">
        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
          <SectionHeader
            title={t("latestTitle")}
            description={t("latestSubtitle")}
            action={<SeeAll href="/recipes?ordering=-created_at" />}
          />
          {latest.results.length > 0 ? (
            <RecipeGrid recipes={latest.results} />
          ) : null}
        </section>
      </RevealSection>
    </>
  );
}

async function SeeAll({ href }: { href: string }) {
  const t = await getTranslations("common");
  return (
    <Link
      href={href}
      className="shrink-0 text-sm font-medium text-fg-brand underline-offset-4 transition-colors hover:underline"
    >
      {t("seeAll")}
    </Link>
  );
}
