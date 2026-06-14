/** Shared types/helpers for DRF (Django REST Framework) endpoints. */

/** Standard DRF paginated list envelope. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** List params common to DRF endpoints. */
export interface ListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: unknown;
}

/**
 * Normalize a list response: DRF returns `{count,results}` when paginated, but
 * some viewsets (pagination disabled) return a bare array. Always yields both.
 */
export function normalizeList<T>(data: Paginated<T> | T[] | null | undefined): {
  results: T[];
  count: number;
} {
  if (Array.isArray(data)) return { results: data, count: data.length };
  if (data && Array.isArray(data.results)) return { results: data.results, count: data.count ?? data.results.length };
  return { results: [], count: 0 };
}
