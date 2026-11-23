/** erp-api attendance dashboard analytics (GET /reports/attendance-analytics, grouped in SQL). */

import { apiClient } from "@/lib/api/client";
import { orFallback } from "@/lib/api/not-found";

export interface AttendanceToday {
  expected: number;
  present: number;
  late: number;
  absent: number;
  on_leave: number;
  field: number;
  early_leave: number;
  unmatched_punches: number;
}

export interface AttendanceTrendPoint {
  date: string;
  present: number;
  late: number;
  absent: number;
}

export interface AttendanceByDepartment {
  department: string;
  present: number;
  late: number;
  absent: number;
}

export interface AttendanceAnalytics {
  today: AttendanceToday;
  trend_30d: AttendanceTrendPoint[];
  by_department: AttendanceByDepartment[];
  overtime_hours_month: number;
  piece_output_month: { quantity: number; amount: number };
  devices: { total: number; online: number };
}

export interface AttendanceAnalyticsParams {
  date?: string;
  outlet_id?: string;
  department_id?: string;
}

const num = (v: unknown) => (v == null || v === "" ? 0 : Number(v) || 0);

/** Coerce the wire shape (decimals may arrive as strings, arrays as null). */
function normalize(raw: Partial<AttendanceAnalytics> | null): AttendanceAnalytics | null {
  if (!raw) return null;
  const t = (raw.today ?? {}) as Partial<Record<keyof AttendanceToday, unknown>>;
  return {
    today: {
      expected: num(t.expected),
      present: num(t.present),
      late: num(t.late),
      absent: num(t.absent),
      on_leave: num(t.on_leave),
      field: num(t.field),
      early_leave: num(t.early_leave),
      unmatched_punches: num(t.unmatched_punches),
    },
    trend_30d: (raw.trend_30d ?? []).map((p) => ({
      date: p.date,
      present: num(p.present),
      late: num(p.late),
      absent: num(p.absent),
    })),
    by_department: (raw.by_department ?? []).map((d) => ({
      department: d.department || "Unassigned",
      present: num(d.present),
      late: num(d.late),
      absent: num(d.absent),
    })),
    overtime_hours_month: num(raw.overtime_hours_month),
    piece_output_month: {
      quantity: num(raw.piece_output_month?.quantity),
      amount: num(raw.piece_output_month?.amount),
    },
    devices: { total: num(raw.devices?.total), online: num(raw.devices?.online) },
  };
}

export const attendanceAnalyticsApi = {
  /** Returns null when the tenant's erp-api does not serve the route yet. */
  get: async (params?: AttendanceAnalyticsParams): Promise<AttendanceAnalytics | null> =>
    normalize(
      await orFallback<Partial<AttendanceAnalytics> | null>(
        apiClient.get<Partial<AttendanceAnalytics>>(`/reports/attendance-analytics`, params),
        null,
      ),
    ),
};
