import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ShoppingListView } from "@/components/shopping-list/shopping-list-view";
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
  const t = await getTranslations({ locale, namespace: "shoppingList" });
  return {
    title: t("title"),
    description: t("subtitle"),
    // Per-user data: never cached by a crawler.
    robots: { index: false, follow: false },
  };
}

export default async function ShoppingListPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The view is a client component: the data belongs to the signed-in user and
  // must never land in a shared cache. `useRequireAuth` bounces to /login
  // with a return path when there is no session.
  return <ShoppingListView />;
}
