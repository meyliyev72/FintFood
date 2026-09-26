import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/**
 * Locale negotiation.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy`; the
 * contract (default export + `config.matcher`) is unchanged.
 */
const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: Parameters<typeof handleI18nRouting>[0]) {
  return handleI18nRouting(request);
}

export const config = {
  /**
   * Match every path except Next.js internals, the API proxy targets and any
   * file with an extension (favicon, images, robots.txt, sitemap.xml, ...).
   */
  matcher: ["/((?!api|_next|_vercel|media|.*\\..*).*)"],
};
