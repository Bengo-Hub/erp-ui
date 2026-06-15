/** Shared types/helpers for erp-api list endpoints. */

/**
 * erp-api list envelope (shared pagination lib): `{data,total,limit,page,hasMore}`.
 *
 * The legacy DRF shape (`{count,next,previous,results}`) is kept in the type union
 * so older callers that still read `.results`/`.count` type-check; `normalizeList`
 * understands both shapes at runtime and always yields `{results,count}`.
 */
export interface Paginated<T> {
  // erp-api shape
  data?: T[];
  total?: number;
  limit?: number;
  page?: number;
  hasMore?: boolean;
  // legacy DRF shape (still tolerated at runtime)
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

/** List params accepted by erp-api list endpoints. */
export interface ListParams {
  /** 1-based page number. */
  page?: number;
  /** Page size. */
  limit?: number;
  /** Offset (alternative to page). */
  offset?: number;
  [key: string]: unknown;
}

/**
 * Normalize a list response to `{results,count}`.
 *
 * Handles:
 *  - erp-api envelope `{data,total,...}`
 *  - legacy DRF envelope `{count,results,...}`
 *  - a bare array (pagination disabled / single-object endpoints)
 */
export function normalizeList<T>(
  data: Paginated<T> | T[] | null | undefined,
): { results: T[]; count: number } {
  if (Array.isArray(data)) return { results: data, count: data.length };
  if (data && Array.isArray(data.data)) {
    return { results: data.data, count: data.total ?? data.data.length };
  }
  if (data && Array.isArray(data.results)) {
    return { results: data.results, count: data.count ?? data.results.length };
  }
  return { results: [], count: 0 };
}
