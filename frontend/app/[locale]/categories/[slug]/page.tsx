import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CategoryRecipes } from "@/components/category/category-recipes";
import { RecipeGridSkeleton } from "@/components/recipe/recipe-grid";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { recipesApi } from "@/lib/api";
import { ApiError, mediaUrl } from "@/lib/api/client";
import { categoriesApi } from "@/lib/api/catalog";
import { readPageParam, readPaginated } from "@/lib/api/paginated-read";
import type { Category, Paginated, Recipe } from "@/types";

type Params = { params: Promise<{ locale: Locale; slug: string }> };
type Search = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Public, cacheable page (§3.2). */
export const revalidate = 300;

function localeMap(path: (locale: string) => string) {
  return Object.fromEntries(routing.locales.map((code) => [code, path(code)]));
}

async function findCategory(slug: string, locale: Locale) {
  try {
    return await categoriesApi.detail(slug, {
      locale,
      next: { revalidate },
    });
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await findCategory(slug, locale);
  if (!category) return { title: slug };

  const tc = await getTranslations({ locale, namespace: "common" });
  return {
    title: category.name,
    description: category.description || undefined,
    alternates: {
      canonical: `/${locale}/categories/${slug}`,
      languages: localeMap((code) => `/${code}/categories/${slug}`),
    },
    openGraph: {
      title: `${category.name} | ${tc("appName")}`,
      description: category.description || undefined,
      locale,
      type: "website",
      ...(category.image ? { images: [{ url: category.image }] } : {}),
    },
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: Params & Search) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const category = await findCategory(slug, locale);
  if (!category) notFound();

  // Only the requested page is server-rendered; `CategoryRecipes` takes over
  // from page two onwards. An out-of-range page is clamped and canonicalised
  // by `readPaginated` instead of 500-ing.
  const query = await searchParams;
  const requested = readPageParam(query.page);
  const initialPage = await readPaginated<Recipe>({
    page: requested,
    clampPath: `/${locale}/categories/${slug}`,
    read: (page) =>
      recipesApi.list(
        { category: slug, page },
        { locale, next: { revalidate } },
      ) as Promise<Paginated<Recipe>>,
  });

  const [tc, tn, tr] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "categories" }),
  ]);
  const image = mediaUrl(category.image);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <nav aria-label={tc("breadcrumb")} className="mb-5">
        <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-sm text-fg-muted">
          <li>
            <Link
              href="/"
              className="transition-colors hover:text-fg-brand"
              aria-label={tn("home")}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
                <path
                  d="M4 11.5 12 4l8 7.5M6.5 10v9h11v-9"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li>
            <Link href="/categories" className="transition-colors hover:text-fg-brand">
              {tr("title")}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li aria-current="page" className="font-medium text-fg">
            {category.name}
          </li>
        </ol>
      </nav>

      <CategoryHeader category={category} image={image} countLabel={tr("recipeCount", { count: category.recipe_count })} />

      <Suspense fallback={<RecipeGridSkeleton count={8} />}>
        <CategoryRecipes slug={slug} initialPage={initialPage} />
      </Suspense>
    </div>
  );
}

function CategoryHeader({
  category,
  image,
  countLabel,
}: {
  category: Category;
  image: string | null;
  countLabel: string;
}) {
  return (
    <header className="mb-8 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <div className="grid sm:grid-cols-[1.1fr_1fr]">
        <div className="order-2 space-y-3 p-6 sm:order-1 sm:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            {category.name}
          </h1>
          {category.description ? (
            <p className="text-base leading-relaxed text-fg-muted">{category.description}</p>
          ) : null}
          <p className="text-sm font-medium text-fg-brand">{countLabel}</p>
        </div>
        {image ? (
          <div className="relative order-1 aspect-[16/10] bg-surface-sunken sm:order-2 sm:aspect-auto sm:min-h-[17rem]">
            <Image
              src={image}
              alt={category.name}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
