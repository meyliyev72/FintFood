import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware replacements for `next/link` and `next/navigation`.
 *
 * Always use these instead of the Next.js originals inside `[locale]` routes,
 * so every href automatically receives the active locale prefix:
 *   <Link href="/recipes">        -> /uz/recipes
 *   redirect({href: "/login"})    -> /uz/login
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
