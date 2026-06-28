/**
 * erp-api HRM / payroll statutory reports.
 *
 * All report data comes from `/reports/<type>` (GET, params:
 * year/month/outlet_id). Exports stream a tenant-branded document from
 * `/reports/<type>/export?format=pdf|excel` (server-side fpdf/excelize render).
 *
 * One service surface drives the config-driven report runner (see
 * `src/hooks/use-reports.ts` + `components/reports/*`).
 */

import { apiClient } from "@/lib/api/client";

const BASE = "/reports";

/** A single report row is an open record (columns are config-driven). */
export type ReportRow = Record<string, unknown>;

/** Backend-driven column definition (e.g. dynamic muster-roll per-component columns). */
export interface ReportColumnDef {
  key: string;
  header: string;
  money?: boolean;
  numeric?: boolean;
  sticky?: boolean;
}

/**
 * erp-api report response: `{report, period, columns, rows, totals}`.
 * Legacy `data`/`results`/`summary` keys are tolerated for older callers.
 */
export interface ReportResponse {
  report?: string;
  period?: { start?: string; end?: string };
  columns?: string[];
  column_defs?: ReportColumnDef[];
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

export type ReportFormat = "pdf" | "excel" | "csv";

const EXT: Record<ReportFormat, string> = { pdf: "pdf", excel: "xlsx", csv: "csv" };

export const reportsApi = {
  /** Fetch report rows for `path` (e.g. `p9-tax`) with the given params. */
  run: (path: string, params?: ReportParams) =>
    apiClient.get<ReportResponse | ReportRow[]>(`${BASE}/${path}/`, params),

  /**
   * Stream a server-rendered export blob from `/reports/<type>/export`
   * (format=pdf|excel). The erp-api documents layer adapts the report to a
   * tenant-branded PDF (fpdf) or Excel workbook (excelize).
   */
  export: (exportType: string, format: ReportFormat, params?: ReportParams) =>
    apiClient.getBlob(
      `${BASE}/${exportType}/export`,
      `${exportType}_report.${EXT[format]}`,
      { format, ...params },
    ),
};

/** Normalize a report response into rows + optional summary + backend column defs + totals. */
export function normalizeReport(res: ReportResponse | ReportRow[] | null | undefined): {
  rows: ReportRow[];
  summary: Record<string, unknown> | undefined;
  columnDefs: ReportColumnDef[] | undefined;
  totals: Record<string, unknown> | undefined;
} {
  if (Array.isArray(res)) return { rows: res, summary: undefined, columnDefs: undefined, totals: undefined };
  if (!res) return { rows: [], summary: undefined, columnDefs: undefined, totals: undefined };
  const rows = Array.isArray(res.rows)
    ? res.rows
    : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.results)
        ? res.results
        : [];
  return {
    rows,
    summary: res.totals ?? res.summary,
    columnDefs: res.column_defs,
    totals: res.totals,
  };
}
