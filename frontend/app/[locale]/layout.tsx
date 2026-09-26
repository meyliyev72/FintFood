import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteChrome } from "@/components/layout/site-chrome";
import { SiteFooter } from "@/components/layout/site-footer";
import { routing } from "@/i18n/routing";
import { AppProviders } from "@/providers";

/**
 * Inter covers Latin (uz) and Cyrillic (ru) with the same family, so the UI
 * does not shift metrics when the language changes.
 */
const inter = Inter({
  variable: "--font-app-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Makes this layout eligible for static rendering with next-intl.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} h-full scroll-smooth`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-fg antialiased">
        <NextIntlClientProvider>
          <AppProviders>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[8px] focus:bg-brand focus:px-4 focus:py-2 focus:text-fg-inverse"
            >
              {(await getTranslations("common"))("skipToContent")}
            </a>
            <SiteChrome>
              {/* Clears the fixed mobile bottom bar. */}
              <main id="main" className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
                {children}
              </main>
            </SiteChrome>
            <SiteFooter />
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
