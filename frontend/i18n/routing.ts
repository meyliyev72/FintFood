import { defineRouting } from "next-intl/routing";

export const locales = ["uz", "ru", "en"] as const;

export type Locale = (typeof locales)[number];

/**
 * Uzbek is the product default. English stays the source locale so
 * `next-intl` messages always resolve, while product copy is authored in uz.
 */
export const defaultLocale: Locale = "uz";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const localeNames: Record<Locale, string> = {
  uz: "Oʻzbekcha",
  ru: "Русский",
  en: "English",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Maps an arbitrary locale string (cookie, header) onto a supported locale. */
export function resolveLocale(value: unknown): Locale | undefined {
  if (typeof value !== "string") return undefined;
  const exact = value.trim().toLowerCase();
  if (isLocale(exact)) return exact;
  const base = exact.split(/[-_]/)[0];
  return isLocale(base) ? base : undefined;
}
