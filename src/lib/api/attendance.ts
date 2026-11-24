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

/** A day-wise schedule row for a work shift (erp-api WorkShiftSchedule). */
export interface WorkShiftSchedule {
  id?: number | string;
  work_shift_id?: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  start_time?: string;
  end_time?: string;
  break_hours?: string | number;
  is_working_day?: boolean;
  [key: string]: unknown;
}

/** erp-api ShiftRotation: each shift runs `run_duration run_unit`, then a break of
 *  `break_duration break_unit` before the next shift in `shift_ids` takes over. */
export interface ShiftRotation {
  id: number | string;
  title?: string;
  shift_ids?: string[];
  /** Shift names in rotation order (list view only). */
  shift_names?: string[];
  run_duration?: number;
  run_unit?: string;
  break_duration?: number;
  break_unit?: string;
  next_change_date?: string | null;
  is_active?: boolean;
  [key: string]: unknown;
}

/** Units the rotation scheduler understands (singular or plural, any case). */
export const ROTATION_UNITS = [
  { value: "Day", label: "Day(s)" },
  { value: "Week", label: "Week(s)" },
  { value: "Month", label: "Month(s)" },
  { value: "Year", label: "Year(s)" },
] as const;

/** A day off granted to one employee (erp-api OffDay). Public holidays are a separate model. */
export interface OffDay {
  id: number | string;
  employee_id?: string;
  employee_name?: string;
  employee_number?: string;
  date?: string;
  reason?: string | null;
  [key: string]: unknown;
}

export type AttendanceRuleType =
  | "late_policy"
  | "overtime_policy"
  | "absenteeism_policy"
  | "work_hours_policy"
  | "break_policy"
  | "holiday_policy";

export const RULE_TYPES: { value: AttendanceRuleType; label: string }[] = [
  { value: "late_policy", label: "Lateness" },
  { value: "overtime_policy", label: "Overtime" },
  { value: "absenteeism_policy", label: "Absenteeism" },
  { value: "work_hours_policy", label: "Work hours" },
  { value: "break_policy", label: "Breaks" },
  { value: "holiday_policy", label: "Holiday pay" },
];

/** erp-api AttendanceRule; decimals arrive as strings. */
export interface AttendanceRule {
  id: number | string;
  name?: string;
  rule_type?: AttendanceRuleType;
  description?: string | null;
  is_active?: boolean;
  priority?: number;
  late_threshold_minutes?: number;
  late_penalty_type?: string;
  late_penalty_value?: string;
  overtime_threshold_hours?: string;
  overtime_rate_multiplier?: string;
  max_overtime_hours?: string;
  standard_work_hours?: string;
  min_work_hours?: string;
  max_work_hours?: string;
  consecutive_absent_threshold?: number;
  monthly_absent_threshold?: number;
  absenteeism_action?: string;
  break_duration_minutes?: number;
  holiday_pay_multiplier?: string;
  [key: string]: unknown;
}

export interface Timesheet {
  id: number | string;
  employee?: number | string;
  employee_id?: string;
  employee_name?: string;
  employee_number?: string;
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
  cycle_days?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  [key: string]: unknown;
}

/** A per-(employee, cycle-day) slot within a rotating roster. */
export interface RosterSlot {
  id: string;
  roster_id?: string;
  employee_id?: string;
  cycle_day?: number;
  start_time?: string;
  end_time?: string;
  is_off_day?: boolean;
  [key: string]: unknown;
}

/** A one-off attendance override for an employee on a date (extra shift, off, etc.). */
export interface AttendanceOverride {
  id: string;
  employee_id?: string;
  employee_name?: string;
  date?: string;
  override_type?: OverrideType;
  work_shift_id?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  /** Work shift name and default hours, for rows the weekly shift planner wrote. */
  shift_name?: string;
  shift_start_time?: string;
  shift_end_time?: string;
  /** True for rows the weekly shift planner wrote. */
  from_planner?: boolean;
  reason?: string | null;
  status?: string;
  [key: string]: unknown;
}

/** erp-api staff_shift_override.override_type values. */
export type OverrideType = "off_duty" | "manual_shift" | "half_day";

export const OVERRIDE_TYPES: { value: OverrideType; label: string }[] = [
  { value: "off_duty", label: "Day off" },
  { value: "manual_shift", label: "Changed shift" },
  { value: "half_day", label: "Half day" },
];

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

/** A resolved per-employee/per-day planner cell from /shift-planner. */
export interface PlannerCell {
  employee?: number | string;
  employee_name?: string;
  date?: string;
  work_shift_id?: string;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
  is_off?: boolean;
  override_id?: string;
  [key: string]: unknown;
}

/** Upsert payload for a single drawable planner cell. */
export interface PlannerCellInput {
  employee_id: string;
  date: string;
  /** Omit / empty => an explicit off-duty cell. */
  work_shift_id?: string;
  start_time?: string;
  end_time?: string;
}

function crud<T extends { id: number | string }>(segment: string) {
  const base = `${ATT}/${segment}`;
  return {
    list: (params?: ListParams, signal?: AbortSignal) =>
      apiClient.get<Paginated<T> | T[]>(`${base}/`, params, { signal }),
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
    // Day-wise schedules: GET lists rows for a shift; PUT upserts ONE day at a
    // time (erp-api UpsertSchedule keys on (shift, day)).
    listSchedules: (shiftId: number | string) =>
      apiClient.get<Paginated<WorkShiftSchedule> | WorkShiftSchedule[]>(`${ATT}/shifts/${shiftId}/schedules`),
    upsertSchedule: (shiftId: number | string, data: WorkShiftSchedule) =>
      apiClient.put<WorkShiftSchedule>(`${ATT}/shifts/${shiftId}/schedules`, {
        day: data.day,
        start_time: data.start_time,
        end_time: data.end_time,
        break_hours: String(data.break_hours ?? "0"),
        is_working_day: data.is_working_day ?? true,
      }),
  },
  rotations: crud<ShiftRotation>("rotations"),
  offDays: crud<OffDay>("off-days"),
  rosters: {
    ...crud<ShiftRoster>("rosters"),
    // erp-api roster create takes {name, cycle_days, start_date}; no PUT (delete only).
    create: (data: Partial<ShiftRoster>) =>
      apiClient.post<ShiftRoster>(`${ATT}/rosters/`, {
        name: data.name,
        cycle_days: data.cycle_days,
        start_date: data.start_date,
      }),
    // Slots: GET lists a roster's slots; PUT upserts ONE (employee, cycle_day) slot.
    listSlots: (rosterId: number | string) =>
      apiClient.get<Paginated<RosterSlot> | RosterSlot[]>(`${ATT}/rosters/${rosterId}/slots`),
    upsertSlot: (rosterId: number | string, data: Partial<RosterSlot>) =>
      apiClient.put<RosterSlot>(`${ATT}/rosters/${rosterId}/slots`, {
        employee_id: data.employee_id,
        cycle_day: data.cycle_day,
        start_time: data.start_time,
        end_time: data.end_time,
        is_off_day: data.is_off_day ?? false,
      }),
  },
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
    apiClient.get<Paginated<AttendanceOverride> | AttendanceOverride[]>(`${ATT}/overrides/`, params),
  createOverride: (data: Partial<AttendanceOverride>) =>
    apiClient.post<AttendanceOverride>(`${ATT}/overrides/`, data),
  // Resolved per-cell planner grid (erp-api GET /hrm/attendance/shift-planner).
  resolvePlanner: (params: { from: string; to: string; employee_ids?: string }) =>
    apiClient.get<{ results?: PlannerCell[]; data?: PlannerCell[] } | PlannerCell[]>(
      `${ATT}/shift-planner`,
      params,
    ),
  // Upsert one drawable cell (PUT) — assigns a shift onto (employee, date).
  upsertPlannerCell: (data: PlannerCellInput) =>
    apiClient.put<PlannerCell>(`${ATT}/shift-planner/cell`, data),
  // Clear one cell (DELETE by employee_id + date query).
  clearPlannerCell: (employeeId: string, date: string) =>
    apiClient.delete<void>(
      `${ATT}/shift-planner/cell?employee_id=${encodeURIComponent(employeeId)}&date=${encodeURIComponent(date)}`,
    ),
};
