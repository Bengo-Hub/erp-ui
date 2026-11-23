/**
 * Helpers for endpoints that a tenant's erp-api may not serve yet (a newer route on an older
 * deployment). A 404 or 405 from such a route means "nothing here", so the page renders its
 * empty state instead of an error panel. Any other failure still throws.
 */

import { type Paginated } from "@/lib/api/drf";

export function isMissingRoute(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 404 || status === 405 || status === 501;
}

/** Resolve to `fallback` when the route is missing; rethrow anything else. */
export async function orFallback<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (isMissingRoute(error)) return fallback;
    throw error;
  }
}

/** An empty list envelope in the erp-api shape. */
export function emptyPage<T>(): Paginated<T> {
  return { data: [], total: 0, page: 1, limit: 0 };
}
