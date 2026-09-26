"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe `window.matchMedia` hook.
 *
 * Returns `false` on the server and during the first client render, then the
 * real value after mount, so markup stays deterministic for hydration.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const list = window.matchMedia(query);
    setMatches(list.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Tailwind's `md` breakpoint, used to switch the mobile/desktop shells. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
