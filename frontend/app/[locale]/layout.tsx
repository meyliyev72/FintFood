import { Fraunces, Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteChrome } from "@/components/layout/site-chrome";
import { SiteFooter } from "@/components/layout/site-footer";
import { absoluteUrl } from "@/lib/api/client";
import { routing } from "@/i18n/routing";
import { AppProviders } from "@/providers";

/**
 * Inter covers Latin (uz) and Cyrillic (ru) with the same family, so the UI
 * does not shift metrics when the language changes. Fraunces is the editorial
 * heading serif from §3; it is Latin-only, and because it is scoped to
 * headings (see globals.css) the Uzbek and Russian headings still fall back
 * cleanly rather than rendering in a mismatched Cyrillic face.
 */
const inter = Inter({
  variable: "--font-app-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-app-serif",
  subsets: ["latin"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  const tz = await getTranslations({ locale, namespace: "meta" });

  return {
    // Required so `alternates.canonical` and OG URLs resolve to absolute
    // addresses instead of staying root-relative.
    metadataBase: new URL(absoluteUrl("/")),
    title: {
      default: `${t("appName")} — ${t("tagline")}`,
      template: `%s | ${t("appName")}`,
    },
    description: tz("description"),
    applicationName: t("appName"),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFCF8" },
    { media: "(prefers-color-scheme: dark)", color: "#121210" },
  ],
};

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
      className={`${inter.variable} ${fraunces.variable} h-full scroll-smooth`}
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
