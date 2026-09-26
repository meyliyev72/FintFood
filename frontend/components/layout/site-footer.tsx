import { getTranslations, getLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";

/**
 * Site footer.
 *
 * Rendered on the server, so it reads the message catalog directly and
 * ships zero JavaScript.
 */
export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const locale = (await getLocale()) as Locale;
  const year = new Date().getFullYear();

  const explore = [
    { href: "/recipes", label: tn("recipes") },
    { href: "/find", label: tn("findByIngredients") },
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
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + blurb */}
          <div className="space-y-3 lg:col-span-1">
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
          </div>

          <FooterColumn title={t("explore")} links={explore} />
          <FooterColumn title={t("account")} links={account} />

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
