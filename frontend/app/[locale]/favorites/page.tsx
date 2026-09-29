import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FavoritesView } from "@/components/favorites/favorites-view";
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
  const t = await getTranslations({ locale, namespace: "favorites" });
  return {
    title: t("title"),
    description: t("subtitle"),
    // Per-user data: keep it out of search results.
    robots: { index: false, follow: false },
  };
}

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FavoritesView />;
}
