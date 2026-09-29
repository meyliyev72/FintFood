"use client";

import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { routing } from "@/i18n/routing";

/**
 * Resolves the `?next=` return-to target.
 *
 * Only same-origin, locale-prefixed paths are honoured. Anything else — an
 * absolute URL, a protocol-relative `//evil.com`, or a path that is not under a
 * supported locale — collapses to the home page, so `?next=` can never be used
 * as an open redirect. The locale prefix is stripped because the locale-aware
 * router adds it back.
 */
export function useSafeRedirect(fallback: string = "/") {
  const searchParams = useSearchParams();

  return useCallback((): string => {
    const next = searchParams?.get("next");
    if (!next) return fallback;
    if (!next.startsWith("/") || next.startsWith("//")) return fallback;

    const segments = next.split("/").filter(Boolean);
    const [maybeLocale, ...rest] = segments;
    const isPrefixed = (routing.locales as readonly string[]).includes(maybeLocale);
    if (!isPrefixed) return fallback;

    return rest.length ? `/${rest.join("/")}` : "/";
  }, [searchParams, fallback]);
}

/** Builds a `?next=` value for a locale-prefixed pathname. */
export function nextParam(pathname: string): string {
  return `?next=${encodeURIComponent(pathname)}`;
}
