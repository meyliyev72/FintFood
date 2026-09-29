import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { IngredientList } from "@/components/recipe/ingredient-list";
import { InstructionSteps } from "@/components/recipe/instruction-steps";
import { NutritionPanel } from "@/components/recipe/nutrition-panel";
import { RecipeActions } from "@/components/recipe/recipe-actions";
import { ReviewSection } from "@/components/recipe/review-section";
import { RatingStars } from "@/components/ui/form";
import { Link } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { recipesApi } from "@/lib/api";
import { ApiError, absoluteUrl, mediaUrl } from "@/lib/api/client";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";
import type { Recipe } from "@/types";

/** Public, cacheable page: pre-rendered shell, revalidated every 5 minutes. */
export const revalidate = 300;

type Params = { params: Promise<{ locale: Locale; slug: string }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function loadRecipe(slug: string, locale: Locale): Promise<Recipe | null> {
  try {
    return await recipesApi.detail(slug, { locale, next: { revalidate: 300 } });
  } catch (error) {
    // A missing recipe is a 404, not a crash: metadata and the page both
    // degrade gracefully so the crawler sees a real "not found".
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const recipe = await loadRecipe(slug, locale);

  if (!recipe) {
    const t = await getTranslations({ locale, namespace: "recipe" });
    return { title: t("notFound") };
  }

  const tc = await getTranslations({ locale, namespace: "common" });
  const description = recipe.description.slice(0, 160);
  const cover = mediaUrl(recipe.image);
  const path = `/${locale}/recipes/${recipe.slug}`;

  return {
    title: recipe.title,
    description,
    alternates: {
      canonical: path,
      languages: Object.fromEntries(
        locales.map((code) => [code, `/${code}/recipes/${recipe.slug}`]),
      ),
    },
    openGraph: {
      title: `${recipe.title} | ${tc("appName")}`,
      description,
      url: absoluteUrl(path),
      locale,
      type: "article",
      ...(cover ? { images: [{ url: absoluteUrl(cover) }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.title,
      description,
      ...(cover ? { images: [absoluteUrl(cover)] } : {}),
    },
  };
}

export default async function RecipeDetailPage({ params }: Params) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const recipe = await loadRecipe(slug, locale);
  if (!recipe) notFound();

  const t = await getTranslations("recipe");
  const tr = await getTranslations("recipes");
  const tc = await getTranslations("common");

  const cover = mediaUrl(recipe.image);
  const gallery = recipe.images ?? [];
  const [prep, cook, total, rating, served] = await Promise.all([
    formatDuration(recipe.prep_time),
    formatDuration(recipe.cooking_time),
    formatDuration(recipe.total_time),
    formatNumber(recipe.average_rating ?? 0),
    formatNumber(recipe.servings, 0),
  ]);

  return (
    <article className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav
        aria-label={tc("page")}
        className="mb-5 flex flex-wrap items-center gap-2 text-sm text-fg-muted"
      >
        <Link href="/" className="transition-colors hover:text-fg-brand">
          {tc("appName")}
        </Link>
        <span aria-hidden>/</span>
        <Link href="/recipes" className="transition-colors hover:text-fg-brand">
          {tr("title")}
        </Link>
        {recipe.category ? (
          <>
            <span aria-hidden>/</span>
            <Link
              href={`/categories/${recipe.category.slug}`}
              className="transition-colors hover:text-fg-brand"
            >
              {recipe.category.name}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-sunken">
            {cover ? (
              <Image
                src={cover}
                alt={recipe.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            ) : null}
          </div>

          {gallery.length > 1 ? (
            <ul className="m-0 grid list-none grid-cols-4 gap-3 p-0">
              {gallery.map((image) => {
                const src = mediaUrl(image.url);
                if (!src) return null;
                return (
                  <li
                    key={image.id}
                    className="relative aspect-square overflow-hidden rounded-[12px] border border-border bg-surface-sunken"
                  >
                    <Image
                      src={src}
                      alt={image.alt || recipe.title}
                      fill
                      sizes="(max-width: 1024px) 25vw, 12vw"
                      className="object-cover"
                    />
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-fg sm:text-4xl">
              {recipe.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
              {recipe.average_rating ? (
                <span className="inline-flex items-center gap-1.5">
                  <RatingStars value={recipe.average_rating} />
                  <span className="font-semibold tabular-nums text-fg">
                    {rating}
                  </span>
                  <span aria-hidden>({recipe.review_count})</span>
                </span>
              ) : null}
              <span aria-hidden>·</span>
              <span>
                {t("by")} {recipe.author.name}
              </span>
              <span aria-hidden>·</span>
              <time dateTime={recipe.created_at}>
                {await formatDate(recipe.created_at)}
              </time>
            </div>
          </div>

          <p className="text-base leading-relaxed text-fg-muted">
            {recipe.description}
          </p>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetaTile label={t("prepTime")} value={prep} />
            <MetaTile label={t("cookTime")} value={cook} />
            <MetaTile label={t("totalTime")} value={total} />
            <MetaTile label={t("servings")} value={served} />
          </dl>

          {recipe.difficulty ? (
            <p className="text-sm text-fg-muted">
              <span className="font-medium text-fg">{t("difficulty")}:</span>{" "}
              {recipe.difficulty}
            </p>
          ) : null}

          <RecipeActions recipe={recipe} />
        </div>
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <section aria-labelledby="ingredients-heading">
          <h2
            id="ingredients-heading"
            className="mb-5 text-xl font-bold tracking-tight text-fg sm:text-2xl"
          >
            {t("ingredients")}
          </h2>
          <IngredientList ingredients={recipe.ingredients ?? []} />
        </section>

        <section aria-labelledby="instructions-heading">
          <h2
            id="instructions-heading"
            className="mb-5 text-xl font-bold tracking-tight text-fg sm:text-2xl"
          >
            {t("instructions")}
          </h2>
          <InstructionSteps steps={recipe.steps ?? []} />
        </section>
      </div>

      {/* Hidden from guests: the block renders nothing when there is no data. */}
      <NutritionPanel recipe={recipe} className="mt-14" />

      <div className="mt-14 border-t border-border pt-10">
        <ReviewSection recipeId={recipe.id} />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(recipeJsonLd(recipe, tc("servings"))),
        }}
      />
    </article>
  );
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-control)] border border-border bg-surface px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums text-fg">{value}</dd>
    </div>
  );
}

/** schema.org/Recipe, restricted to the fields search engines actually require. */
function recipeJsonLd(recipe: Recipe, servingsLabel: string) {
  const cover = mediaUrl(recipe.image);

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    ...(cover ? { image: [absoluteUrl(cover)] } : {}),
    author: { "@type": "Person", name: recipe.author.name },
    datePublished: recipe.created_at,
    ...(recipe.category ? { recipeCategory: recipe.category.name } : {}),
    recipeYield: `${recipe.servings} ${servingsLabel}`,
    ...(recipe.prep_time ? { prepTime: `PT${recipe.prep_time}M` } : {}),
    ...(recipe.cooking_time ? { cookTime: `PT${recipe.cooking_time}M` } : {}),
    ...(recipe.total_time ? { totalTime: `PT${recipe.total_time}M` } : {}),
    ...(recipe.average_rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: recipe.average_rating,
            reviewCount: recipe.review_count || 1,
          },
        }
      : {}),
    ...(recipe.calories
      ? {
          nutrition: {
            "@type": "NutritionInformation",
            calories: `${recipe.calories} calories`,
            ...(recipe.protein ? { proteinContent: recipe.protein } : {}),
            ...(recipe.carbs ? { carbohydrateContent: recipe.carbs } : {}),
            ...(recipe.fat ? { fatContent: recipe.fat } : {}),
          },
        }
      : {}),
    recipeIngredient: (recipe.ingredients ?? []).map(
      (item) => `${item.quantity} ${item.unit} ${item.name}`.trim(),
    ),
    recipeInstructions: (recipe.steps ?? []).map((step) => ({
      "@type": "HowToStep",
      position: step.step_number,
      text: step.instruction,
      ...(step.image ? { image: absoluteUrl(mediaUrl(step.image)!) } : {}),
    })),
  };
}
