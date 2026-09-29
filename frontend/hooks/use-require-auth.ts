"use client";

import { useEffect } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";

/**
 * Gate for the auth-only pages (Favorites, Shopping List, Profile, Create/Edit).
 *
 * Those pages are client components because their data is per-user, so the
 * redirect has to happen client-side too. Two details matter:
 *
 *  - we wait for the session probe to settle before redirecting, otherwise a
 *    signed-in user would bounce to /login on every hard refresh;
 *  - the locale-aware router re-adds the active prefix, and the auth form
 *    restores the return path through `useSafeRedirect`.
 *
 * Returns `true` once it is safe to render the guarded content.
 */
export function useRequireAuth(): boolean {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    router.replace({ pathname: "/login", query: { next: pathname } });
  }, [isAuthenticated, isLoading, pathname, router]);

  return !isLoading && isAuthenticated;
}
