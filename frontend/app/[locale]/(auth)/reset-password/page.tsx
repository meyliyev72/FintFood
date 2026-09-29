import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SkeletonCard } from "@/components/shared";
import { routing, type Locale } from "@/i18n/routing";

type Params = { params: Promise<{ locale: Locale }> };
type Search = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("resetTitle"), robots: { index: false, follow: false } };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function ResetPasswordPage({ params, searchParams }: Params & Search) {
  const { locale } = await params;
  setRequestLocale(locale);

  // `uid`/`token` are consumed by the form, never rendered, and are excluded
  // from indexing via `robots` above.
  const query = await searchParams;
  const uid = first(query.uid);
  const token = first(query.token);

  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16 lg:py-24">
          <SkeletonCard className="border-none bg-transparent p-6 shadow-none sm:p-8" />
        </div>
      }
    >
      <ResetPasswordForm uid={uid} token={token} />
    </Suspense>
  );
}
