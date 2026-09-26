import { getTranslations, getLocale } from "next-intl/server";
import { Suspense } from "react";

import { Link } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";
import { categoriesApi } from "@/lib/api";
import { Skeleton } from "@/components/ui";

/** Social links are placeholders until the accounts exist (§5.8). */
const SOCIAL = ["instagram", "telegram", "youtube", "tiktok"] as const;

/**
 * Site footer.
 *
 * Rendered on the server, so it reads the message catalog directly and ships
 * zero JavaScript. The category column is streamed through Suspense with its
 * own one-hour revalidate, so it does not force every page to be dynamic.
 */
export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const locale = (await getLocale()) as Locale;
  const year = new Date().getFullYear();

  const explore = [
    { href: "/recipes", label: tn("recipes") },
    { href: "/find-by-ingredients", label: tn("findByIngredients") },
    { href: "/categories", label: tn("categories") },
  ] as const;

  const account = [
    { href: "/favorites", label: tn("favorites") },
    { href: "/shopping-list", label: tn("shoppingList") },
    { href: "/profile", label: tn("profile") },
  ] as const;

  return (
    <footer className="mt-20 border-t border-border bg-surface-sunken">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand + blurb */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-[9px] bg-brand text-fg-inverse">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
                  <path
                    d="M7 20h10M6 16h12M8 16a4 4 0 0 1-1.2-7.8A4.5 4.5 0 0 1 16 7.6 4.2 4.2 0 0 1 16 16H8Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-base font-extrabold tracking-tight text-fg">FintFood</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-fg-muted">{t("about")}</p>

            <ul className="flex items-center gap-2 pt-1" aria-label={t("social")}>
              {SOCIAL.map((network) => (
                <li key={network}>
                  <span
                    aria-disabled="true"
                    title={t("socialPlaceholder", { network })}
                    className="grid size-9 cursor-not-allowed place-items-center rounded-[10px] border border-border bg-surface text-fg-subtle"
                  >
                    <SocialGlyph network={network} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumn title={t("explore")} links={explore} />
          <FooterColumn title={t("account")} links={account} />

          <Suspense fallback={<CategoryColumnSkeleton />}>
            <FooterCategories label={tn("categories")} locale={locale} />
          </Suspense>

          {/* Language — links to the same page in each locale */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              {t("language")}
            </h2>
            <ul className="space-y-2">
              {locales.map((option) => (
                <li key={option}>
                  <Link
                    href="/"
                    locale={option}
                    className="text-sm text-fg-muted transition-colors hover:text-fg-brand"
                  >
                    {localeNames[option]}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-fg-subtle" lang={locale}>
              {t("tagline")}
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs text-fg-subtle">{t("rights", { year })}</p>
        </div>
      </div>
    </footer>
  );
}

/** Real category links, cached for an hour so the footer stays off the hot path. */
async function FooterCategories({ label, locale }: { label: string; locale: Locale }) {
  const categories = await categoriesApi.list({
    locale,
    next: { revalidate: 3600 },
  });
  const top = categories.slice(0, 5);

  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
        {label}
      </h2>
      <ul className="space-y-2">
        {top.map((category) => (
          <li key={category.id}>
            <Link
              href={`/categories/${category.slug}`}
              className="text-sm text-fg-muted transition-colors hover:text-fg-brand"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryColumnSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="mb-3 h-3 w-20" />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-4 w-28" />
        ))}
      </div>
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
        {title}
      </h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-fg-muted transition-colors hover:text-fg-brand"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Simple monochrome glyphs; the accounts themselves are placeholders. */
function SocialGlyph({ network }: { network: (typeof SOCIAL)[number] }) {
  const paths: Record<(typeof SOCIAL)[number], string> = {
    instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.5-.5h.01",
    telegram: "M21 5 3 11.5l4.5 1.5L18 8l-8 7.5.5 4 2.5-3.5 4 3 1-14Z",
    youtube: "M3 8.5A3.5 3.5 0 0 1 6.5 5h11A3.5 3.5 0 0 1 21 8.5v7a3.5 3.5 0 0 1-3.5 3.5h-11A3.5 3.5 0 0 1 3 15.5v-7Zm9 2.5v3l3-1.5-3-1.5Z",
    tiktok: "M15 4c.5 2 2 3.5 4 3.8v2.6c-1.5 0-2.8-.5-4-1.3V15a5 5 0 1 1-4-5v2.7a2.3 2.3 0 1 0 1.6 2.2V4H15Z",
  };

  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d={paths[network]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
