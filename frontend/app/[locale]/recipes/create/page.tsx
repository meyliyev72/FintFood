import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RecipeCreateView } from "@/components/recipe/recipe-create-view";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recipeForm" });
  return {
    title: t("createTitle"),
    description: t("createSubtitle"),
    // Only signed-in authors can publish, so there is nothing to index.
    robots: { index: false, follow: false },
  };
}

export default async function RecipeCreatePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Client component: the draft is user data and `useRequireAuth` bounces to
  // /login with a return path when there is no session.
  return <RecipeCreateView />;
}
