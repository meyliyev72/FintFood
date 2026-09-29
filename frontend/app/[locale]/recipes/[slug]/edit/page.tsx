import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RecipeEditView } from "@/components/recipe/recipe-edit-view";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recipeForm" });
  return {
    title: t("editTitle"),
    description: t("editSubtitle"),
    // Per-author editing surface: not for crawlers.
    robots: { index: false, follow: false },
  };
}

export default async function RecipeEditPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <RecipeEditView slug={slug} />;
}
