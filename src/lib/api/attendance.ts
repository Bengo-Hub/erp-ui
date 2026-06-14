/** erp-api attendance endpoints: records, work-shifts, rotations, off-days,
 *  timesheets (+ approvals), shift-planner rosters/assignments/overrides. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const ATT = "/hrm/attendance";

export interface AttendanceRecord {
  id: number;
  employee?: number;
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
  id: number;
  name?: string;
  start_time?: string;
  end_time?: string;
  break_duration?: string | number;
  grace_period?: string | number;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface ShiftRotation {
  id: number;
  title?: string;
  name?: string;
  description?: string;
  shifts?: number[];
  rotation_period?: string | number;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface OffDay {
  id: number;
  name?: string;
  date?: string;
  description?: string;
  is_recurring?: boolean;
  [key: string]: unknown;
}

export interface AttendanceRule {
  id: number;
  name?: string;
  description?: string;
  late_grace_minutes?: string | number;
  overtime_after_minutes?: string | number;
  half_day_threshold?: string | number;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface Timesheet {
  id: number;
  employee?: number;
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
  id: number;
  timesheet?: number;
  date?: string;
  hours?: string | number;
  description?: string;
  [key: string]: unknown;
}

export interface ShiftRoster {
  id: number;
  name?: string;
  title?: string;
  outlet?: number | string;
  start_date?: string;
  end_date?: string;
  status?: string;
  [key: string]: unknown;
}

export interface ShiftAssignment {
  id: number;
  roster?: number;
  employee?: number;
  employee_name?: string;
  work_shift?: number;
  work_shift_name?: string;
  date?: string;
  [key: string]: unknown;
}

/** A resolved per-employee/per-day planner cell from /shift-planner/. */
export interface PlannerCell {
  employee?: number;
  employee_name?: string;
  date?: string;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
  [key: string]: unknown;
}

function crud<T extends { id: number }>(segment: string) {
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
  records: crud<AttendanceRecord>("records"),
  workShifts: crud<WorkShift>("work-shifts"),
  rotations: crud<ShiftRotation>("shift-rotations"),
  offDays: crud<OffDay>("off-days"),
  rosters: crud<ShiftRoster>("shift-rosters"),
  rules: crud<AttendanceRule>("rules"),

  // Timesheets + lifecycle
  timesheets: {
    ...crud<Timesheet>("timesheets"),
    submit: (id: number | string) =>
      apiClient.post<Timesheet>(`${ATT}/timesheets/${id}/submit/`, {}),
    approve: (id: number | string) =>
      apiClient.post<Timesheet>(`${ATT}/timesheets/${id}/approve/`, {}),
    reject: (id: number | string, reason: string) =>
      apiClient.post<Timesheet>(`${ATT}/timesheets/${id}/reject/`, { reason }),
  },

  // Shift-planner assignments + resolve grid
  listAssignments: (params?: ListParams) =>
    apiClient.get<Paginated<ShiftAssignment> | ShiftAssignment[]>(`${ATT}/shift-assignments/`, params),
  createAssignment: (data: Partial<ShiftAssignment>) =>
    apiClient.post<ShiftAssignment>(`${ATT}/shift-assignments/`, data),
  deleteAssignment: (id: number | string) =>
    apiClient.delete<void>(`${ATT}/shift-assignments/${id}/`),
  resolvePlanner: (params: { from: string; to: string; employee_ids?: string }) =>
    apiClient.get<{ results?: PlannerCell[]; data?: PlannerCell[] } | PlannerCell[]>(
      `${ATT}/shift-planner/`,
      params,
    ),
};
