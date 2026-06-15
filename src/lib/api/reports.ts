/**
 * erp-api HRM / payroll statutory reports.
 *
 * All report data comes from `/reports/<type>` (GET, params:
 * year/month/outlet_id). The Go reports handler returns a single report
 * object per call — there are no separate export endpoints, so `export()`
 * hits the same route and the caller renders/prints client-side.
 *
 * One service surface drives the config-driven report runner (see
 * `src/hooks/use-reports.ts` + `components/reports/*`).
 */

import { apiClient } from "@/lib/api/client";

const BASE = "/reports";

/** A single report row is an open record (columns are config-driven). */
export type ReportRow = Record<string, unknown>;

/**
 * erp-api report response: `{report, period, columns, rows, totals}`.
 * Legacy `data`/`results`/`summary` keys are tolerated for older callers.
 */
export interface ReportResponse {
  report?: string;
  period?: { start?: string; end?: string };
  columns?: string[];
  rows?: ReportRow[];
  totals?: Record<string, unknown>;
  // legacy shapes
  success?: boolean;
  data?: ReportRow[];
  results?: ReportRow[];
  message?: string;
  summary?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Filter values shared across reports. erp-api accepts year/month/outlet_id. */
export interface ReportParams {
  year?: number | string;
  month?: number | string;
  outlet_id?: string;
  /** Kept for UI filters that erp-api currently ignores. */
  department_id?: number | string;
  region_id?: number | string;
  employee_id?: number | string;
  from_date?: string;
  to_date?: string;
  [key: string]: unknown;
}

export type ReportFormat = "pdf" | "excel";

export const reportsApi = {
  /** Fetch report rows for `path` (e.g. `p9-tax`) with the given params. */
  run: (path: string, params?: ReportParams) =>
    apiClient.get<ReportResponse | ReportRow[]>(`${BASE}/${path}/`, params),

  /**
   * Stream an export blob. erp-api has no dedicated export endpoint yet (gap):
   * this hits the same JSON report route so the call resolves instead of 404ing;
   * server-side pdf/excel rendering is a pending erp-api feature.
   */
  export: (exportType: string, format: ReportFormat, params?: ReportParams) =>
    apiClient.getBlob(
      `${BASE}/${exportType}`,
      `${exportType}_report.${format === "excel" ? "xlsx" : "pdf"}`,
      { format, ...params },
    ),
};

/** Normalize a report response into a flat row array + optional summary. */
export function normalizeReport(res: ReportResponse | ReportRow[] | null | undefined): {
  rows: ReportRow[];
  summary: Record<string, unknown> | undefined;
} {
  if (Array.isArray(res)) return { rows: res, summary: undefined };
  if (!res) return { rows: [], summary: undefined };
  const rows = Array.isArray(res.rows)
    ? res.rows
    : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.results)
        ? res.results
        : [];
  return { rows, summary: res.totals ?? res.summary };
}
