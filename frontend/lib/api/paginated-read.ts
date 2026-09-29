import { redirect } from "next/navigation";

import { ApiError } from "./client";
import type { Paginated } from "@/types";

/**
 * Pagination helpers for server-rendered list pages.
 *
 * The API answers a page beyond the last one with `404`. Without handling it,
 * `?page=99` would blow up into a 500 from a server component, which is both a
 * broken page and a bad signal for crawlers that follow stale links. Instead the
 * page is clamped to the last available one and the URL is canonicalised with a
 * redirect, so the address bar and the rendered data always agree (В§11).
 */

/** Normalises a raw `?page=` value into a positive integer, defaulting to 1. */
export function readPageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * Reads one page, redirecting to the last page when `page` is out of range.
 *
 * `clampPath` is the locale-prefixed path without a search string, e.g.
 * `/uz/categories/dinner`.
 */
export async function readPaginated<T>({
  page,
  clampPath,
  read,
}: {
  page: number;
  clampPath: string;
  read: (page: number) => Promise<Paginated<T>>;
}): Promise<Paginated<T>> {
  try {
    return await read(page);
  } catch (error) {
    const outOfRange =
      error instanceof ApiError && (error.isNotFound || error.status === 400);
    if (page <= 1 || !outOfRange) throw error;

    const first = await read(1);
    const last = Math.max(first.total_pages, 1);
    if (last === page) return first;
    redirect(last === 1 ? clampPath : `${clampPath}?page=${last}`);
  }
}
