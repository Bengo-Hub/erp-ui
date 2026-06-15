/** erp-api attendance endpoints: records, work-shifts, rotations, off-days,
 *  timesheets (+ approvals), shift-planner rosters/assignments/overrides. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const ATT = "/hrm/attendance";

export interface AttendanceRecord {
  id: number | string;
  employee?: number | string;
  employee_name?: string;
  date?: string;
  check_in?: string;
  check_out?: string;
  status?: string;
  hours_worked?: string | number;
  outlet?: number | string;
  [key: string]: unknown;
}

export interface WorkShift {
  id: number | string;
  name?: string;
  start_time?: string;
  end_time?: string;
  break_duration?: string | number;
  grace_period?: string | number;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface ShiftRotation {
  id: number | string;
  title?: string;
  name?: string;
  description?: string;
  shifts?: number[];
  rotation_period?: string | number;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface OffDay {
  id: number | string;
  name?: string;
  date?: string;
  description?: string;
  is_recurring?: boolean;
  [key: string]: unknown;
}

export interface AttendanceRule {
  id: number | string;
  name?: string;
  description?: string;
  late_grace_minutes?: string | number;
  overtime_after_minutes?: string | number;
  half_day_threshold?: string | number;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface Timesheet {
  id: number | string;
  employee?: number | string;
  employee_name?: string;
  period_start?: string;
  period_end?: string;
  start_date?: string;
  end_date?: string;
  total_hours?: string | number;
  status?: string;
  rejection_reason?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface TimesheetEntry {
  id: number | string;
  timesheet?: number;
  date?: string;
  hours?: string | number;
  description?: string;
  [key: string]: unknown;
}

export interface ShiftRoster {
  id: number | string;
  name?: string;
  title?: string;
  outlet?: number | string;
  start_date?: string;
  end_date?: string;
  status?: string;
  [key: string]: unknown;
}

export interface ShiftAssignment {
  id: number | string;
  roster?: number;
  employee?: number | string;
  employee_name?: string;
  work_shift?: number;
  work_shift_name?: string;
  date?: string;
  [key: string]: unknown;
}

/** A resolved per-employee/per-day planner cell from /shift-planner/. */
export interface PlannerCell {
  employee?: number | string;
  employee_name?: string;
  date?: string;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
  [key: string]: unknown;
}

function crud<T extends { id: number | string }>(segment: string) {
  const base = `${ATT}/${segment}`;
  return {
    list: (params?: ListParams) => apiClient.get<Paginated<T> | T[]>(`${base}/`, params),
    get: (id: number | string) => apiClient.get<T>(`${base}/${id}/`),
    create: (data: Partial<T>) => apiClient.post<T>(`${base}/`, data),
    update: (id: number | string, data: Partial<T>) => apiClient.put<T>(`${base}/${id}/`, data),
    remove: (id: number | string) => apiClient.delete<void>(`${base}/${id}/`),
  };
}

export const attendanceApi = {
  // erp-api records are read-only via the list route plus check-in/check-out
  // actions (no generic create/update/delete server-side).
  records: crud<AttendanceRecord>("records"),
  checkIn: (data: Record<string, unknown>) =>
    apiClient.post<AttendanceRecord>(`${ATT}/records/check-in`, data),
  checkOut: (id: number | string, data?: Record<string, unknown>) =>
    apiClient.post<AttendanceRecord>(`${ATT}/records/${id}/check-out`, data ?? {}),
  // Shifts: erp-api create body uses grace_minutes (not grace_period) and has
  // no DELETE-by-other-name — segment is /shifts. (No PUT on a shift; schedule
  // edits go through /shifts/{id}/schedules, a gap for the simple form.)
  workShifts: {
    ...crud<WorkShift>("shifts"),
    create: (data: Partial<WorkShift>) =>
      apiClient.post<WorkShift>(`${ATT}/shifts/`, {
        name: data.name,
        start_time: data.start_time,
        end_time: data.end_time,
        grace_minutes: data.grace_period ?? (data as Record<string, unknown>).grace_minutes,
        total_hours_per_week: (data as Record<string, unknown>).total_hours_per_week,
      }),
  },
  rotations: crud<ShiftRotation>("rotations"),
  offDays: crud<OffDay>("off-days"),
  rosters: crud<ShiftRoster>("rosters"),
  rules: crud<AttendanceRule>("rules"),

  // Timesheets + lifecycle. erp-api supports list/create + entry upsert +
  // submit/approve/reject (no PUT/DELETE on a timesheet itself).
  timesheets: {
    list: (params?: ListParams) =>
      apiClient.get<Paginated<Timesheet> | Timesheet[]>(`${ATT}/timesheets/`, params),
    get: (id: number | string) => apiClient.get<Timesheet>(`${ATT}/timesheets/${id}/`),
    create: (data: Partial<Timesheet>) =>
      apiClient.post<Timesheet>(`${ATT}/timesheets/`, {
        employee_id: data.employee,
        period_start: data.period_start ?? data.start_date,
        period_end: data.period_end ?? data.end_date,
        notes: (data as Record<string, unknown>).notes,
      }),
    // No timesheet-level update in erp-api; route through entry upsert.
    update: (id: number | string, data: Partial<Timesheet>) =>
      apiClient.put<Timesheet>(`${ATT}/timesheets/${id}/entries`, data),
    remove: (id: number | string) => apiClient.delete<void>(`${ATT}/timesheets/${id}/`),
    upsertEntry: (id: number | string, data: Partial<TimesheetEntry>) =>
      apiClient.put<TimesheetEntry>(`${ATT}/timesheets/${id}/entries`, data),
    submit: (id: number | string) =>
      apiClient.post<Timesheet>(`${ATT}/timesheets/${id}/submit/`, {}),
    approve: (id: number | string) =>
      apiClient.post<Timesheet>(`${ATT}/timesheets/${id}/approve/`, {}),
    reject: (id: number | string, reason: string) =>
      apiClient.post<Timesheet>(`${ATT}/timesheets/${id}/reject/`, { reason }),
  },

  // Roster assignments (erp-api: /hrm/attendance/assignments).
  listAssignments: (params?: ListParams) =>
    apiClient.get<Paginated<ShiftAssignment> | ShiftAssignment[]>(`${ATT}/assignments/`, params),
  createAssignment: (data: Partial<ShiftAssignment>) =>
    apiClient.post<ShiftAssignment>(`${ATT}/assignments/`, data),
  // NOTE: erp-api has no DELETE on an assignment (gap) — only create/list.
  deleteAssignment: (id: number | string) =>
    apiClient.delete<void>(`${ATT}/assignments/${id}/`),
  // Roster overrides (erp-api: /hrm/attendance/overrides).
  listOverrides: (params?: ListParams) =>
    apiClient.get<Paginated<PlannerCell> | PlannerCell[]>(`${ATT}/overrides/`, params),
  createOverride: (data: Record<string, unknown>) =>
    apiClient.post<PlannerCell>(`${ATT}/overrides/`, data),
  // NOTE: no resolved-planner-grid endpoint in erp-api (gap); the planner UI
  // composes rosters + assignments client-side. Falls back to assignments.
  resolvePlanner: (params: { from: string; to: string; employee_ids?: string }) =>
    apiClient.get<{ results?: PlannerCell[]; data?: PlannerCell[] } | PlannerCell[]>(
      `${ATT}/assignments/`,
      params,
    ),
};
