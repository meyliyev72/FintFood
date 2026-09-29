/**
 * Build-time tolerance for server-rendered API reads.
 *
 * Public pages (home, recipe detail, category detail) are React Server
 * Components that are statically generated during `next build`. That means the
 * build has to reach the Django API — which is not guaranteed to be running:
 *
 *  - on Render, the frontend is built before the backend service is healthy;
 *  - locally, §27 requires `npm run build` to succeed on its own.
 *
 * A single unreachable API must not take the whole build down. When the read
 * fails *during the build* we prerender an empty shell and let ISR fill it in
 * on the first revalidation, so the page heals within its `revalidate` window.
 *
 * At runtime nothing is swallowed: errors propagate to `error.tsx` so a broken
 * API is visible instead of silently rendering an empty page.
 */

/** True while `next build` is generating static output. */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * Runs an API read, falling back to `empty` only when the API is unreachable
 * during the build. Runtime errors are re-thrown untouched.
 */
export async function readOrPrerenderEmpty<T>(read: () => Promise<T>, empty: T): Promise<T> {
  if (!isBuildPhase()) return read();

  try {
    return await read();
  } catch {
    return empty;
  }
}

/** An empty page of `Paginated<T>` results. */
export function emptyPage<T>(): {
  count: number;
  total_pages: number;
  page: number;
  next: string | null;
  previous: string | null;
  results: T[];
} {
  return { count: 0, total_pages: 0, page: 1, next: null, previous: null, results: [] };
}
