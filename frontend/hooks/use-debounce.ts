"use client";

import { useEffect, useState } from "react";

/**
 * Debounced mirror of a fast-changing value.
 *
 * Used by the search inputs so a request is issued at most once per `delay`
 * instead of on every keystroke (§19).
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
