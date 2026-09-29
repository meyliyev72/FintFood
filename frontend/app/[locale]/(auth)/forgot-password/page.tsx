import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { routing, type Locale } from "@/i18n/routing";

type Params = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("forgotTitle"), robots: { index: false, follow: false } };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function ForgotPasswordPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The reset email is locale-aware on the server, so the locale is forwarded
  // to keep the message in the same language the user was reading.
  return <ForgotPasswordForm locale={locale} />;
}
