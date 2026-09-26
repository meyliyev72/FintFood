import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";

import { routing } from "./routing";

/**
 * Loads the message catalog for the active locale on every server render.
 *
 * `localePrefix: "always"` means the locale is never inferred from the
 * Accept-Language header, so `requestLocale` is always present here; the
 * `hasLocale` guard still keeps the type narrow and the config total.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
