/**
 * erp-api HRM / payroll statutory reports.
 *
 * All report data comes from `/hrm/payroll/reports/<type>/` (GET, params:
 * year/month/department_id/region_id/project_id/employee_id). Exports stream
 * blobs from `/hrm/payroll/reports/export/<type>/?format=pdf|excel`.
 *
 * One service surface drives the config-driven report runner (see
 * `src/hooks/use-reports.ts` + `components/reports/*`), replacing the legacy
 * 13 near-duplicate report pages.
 */

import { apiClient } from "@/lib/api/client";

const BASE = "/hrm/payroll/reports";

/** A single report row is an open record (columns are config-driven). */
export type ReportRow = Record<string, unknown>;

/** Common shape of a report response (DRF endpoints wrap rows in `data`). */
export interface ReportResponse {
  success?: boolean;
  data?: ReportRow[];
  results?: ReportRow[];
  message?: string;
  summary?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Filter values shared across reports (subset used per report config). */
export interface ReportParams {
  year?: number | string;
  month?: number | string;
  department_id?: number | string;
  region_id?: number | string;
  project_id?: number | string;
  employee_id?: number | string;
  from_date?: string;
  to_date?: string;
  /** Statutory deductions endpoint distinguishes nssf/nhif/nita. */
  deduction_type?: string;
  [key: string]: unknown;
}

export type ReportFormat = "pdf" | "excel";

export const reportsApi = {
  /** Fetch report rows for `path` (e.g. `p9-tax`) with the given params. */
  run: (path: string, params?: ReportParams) =>
    apiClient.get<ReportResponse | ReportRow[]>(`${BASE}/${path}/`, params),

  /** Stream an export blob (pdf/excel) for `exportType` (e.g. `p9`). */
  export: (exportType: string, format: ReportFormat, params?: ReportParams) =>
    apiClient.getBlob(
      `${BASE}/export/${exportType}/`,
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
  const rows = Array.isArray(res.data) ? res.data : Array.isArray(res.results) ? res.results : [];
  return { rows, summary: res.summary };
}
