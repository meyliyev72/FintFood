import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RegisterForm } from "@/components/auth/register-form";
import { SkeletonCard } from "@/components/shared";
import { routing, type Locale } from "@/i18n/routing";

type Params = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("registerTitle"), robots: { index: false, follow: true } };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RegisterPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<AuthSkeleton />}>
      <RegisterForm />
    </Suspense>
  );
}

function AuthSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16 lg:py-24">
      <SkeletonCard className="border-none bg-transparent p-6 shadow-none sm:p-8" />
    </div>
  );
}
