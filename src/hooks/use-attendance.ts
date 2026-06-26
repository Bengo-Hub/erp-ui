"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  attendanceApi,
  type AttendanceOverride,
  type AttendanceRecord,
  type AttendanceRule,
  type OffDay,
  type RosterSlot,
  type ShiftAssignment,
  type ShiftRoster,
  type ShiftRotation,
  type Timesheet,
  type WorkShift,
  type WorkShiftSchedule,
} from "@/lib/api/attendance";
import { type ListParams } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";
import { makeActionHook, makeResourceHooks } from "@/hooks/use-crud-resource";

const records = makeResourceHooks<AttendanceRecord>("attendance-records", attendanceApi.records, "Attendance record");
export const useAttendanceRecords = records.useList;
export const useSaveAttendanceRecord = records.useSave;
export const useDeleteAttendanceRecord = records.useRemove;

/** Manual check-in (POST /records/check-in). */
export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => attendanceApi.checkIn(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-records"] });
      toast.success("Checked in");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to check in")),
  });
}

/** Manual check-out (POST /records/{id}/check-out). */
export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => attendanceApi.checkOut(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-records"] });
      toast.success("Checked out");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to check out")),
  });
}

const shifts = makeResourceHooks<WorkShift>("work-shifts", attendanceApi.workShifts, "Work shift");
export const useWorkShifts = shifts.useList;
export const useWorkShift = shifts.useDetail;
export const useSaveWorkShift = shifts.useSave;
export const useDeleteWorkShift = shifts.useRemove;

// ---- Work-shift day-wise schedules ----
export function useShiftSchedules(shiftId: number | string | null) {
  return useQuery({
    queryKey: ["work-shift-schedules", shiftId],
    queryFn: () => attendanceApi.workShifts.listSchedules(shiftId as number | string),
    enabled: shiftId != null,
  });
}

export function useUpsertShiftSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, data }: { shiftId: number | string; data: WorkShiftSchedule }) =>
      attendanceApi.workShifts.upsertSchedule(shiftId, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["work-shift-schedules", vars.shiftId] });
    },
    onError: (e) => toast.error(extractApiError(e)),
  });
}

const rotations = makeResourceHooks<ShiftRotation>("shift-rotations", attendanceApi.rotations, "Shift rotation");
export const useShiftRotations = rotations.useList;
export const useShiftRotation = rotations.useDetail;
export const useSaveShiftRotation = rotations.useSave;
export const useDeleteShiftRotation = rotations.useRemove;

const offDays = makeResourceHooks<OffDay>("off-days", attendanceApi.offDays, "Off day");
export const useOffDays = offDays.useList;
export const useSaveOffDay = offDays.useSave;
export const useDeleteOffDay = offDays.useRemove;

const rules = makeResourceHooks<AttendanceRule>("attendance-rules", attendanceApi.rules, "Rule");
export const useAttendanceRules = rules.useList;
export const useSaveAttendanceRule = rules.useSave;
export const useDeleteAttendanceRule = rules.useRemove;

// ---- Timesheets ----
const KEY = "timesheets";

export function useTimesheets(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "list", params ?? {}],
    queryFn: () => attendanceApi.timesheets.list(params),
  });
}

export function useTimesheet(id: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => attendanceApi.timesheets.get(id!),
    enabled: !!id,
  });
}

export function useSaveTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<Timesheet> }) =>
      id ? attendanceApi.timesheets.update(id, data) : attendanceApi.timesheets.create(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success(v.id ? "Timesheet updated" : "Timesheet created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save timesheet")),
  });
}

export function useDeleteTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => attendanceApi.timesheets.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Timesheet deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete timesheet")),
  });
}

export const useSubmitTimesheet = makeActionHook(
  KEY,
  (id) => attendanceApi.timesheets.submit(id),
  "Timesheet submitted",
  "Failed to submit timesheet",
);
export const useApproveTimesheet = makeActionHook(
  KEY,
  (id) => attendanceApi.timesheets.approve(id),
  "Timesheet approved",
  "Failed to approve timesheet",
);

export function useRejectTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason: string }) =>
      attendanceApi.timesheets.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Timesheet rejected");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to reject timesheet")),
  });
}

// ---- Shift planner ----
export function usePlannerAssignments(params?: ListParams) {
  return useQuery({
    queryKey: ["shift-assignments", params ?? {}],
    queryFn: () => attendanceApi.listAssignments(params),
  });
}

export function usePlannerResolve(range: { from: string; to: string } | null) {
  return useQuery({
    queryKey: ["shift-planner", range],
    queryFn: () => attendanceApi.resolvePlanner({ from: range!.from, to: range!.to }),
    enabled: !!range?.from && !!range?.to,
  });
}

export function useSaveAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ShiftAssignment>) => attendanceApi.createAssignment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift-assignments"] });
      qc.invalidateQueries({ queryKey: ["shift-planner"] });
      toast.success("Shift assigned");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to assign shift")),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => attendanceApi.deleteAssignment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift-assignments"] });
      qc.invalidateQueries({ queryKey: ["shift-planner"] });
      toast.success("Assignment removed");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to remove assignment")),
  });
}

// ---- Rosters + slots ----
const ROSTER_KEY = "shift-rosters";

export function useRosters(params?: ListParams) {
  return useQuery({
    queryKey: [ROSTER_KEY, "list", params ?? {}],
    queryFn: () => attendanceApi.rosters.list(params),
  });
}

export function useSaveRoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ShiftRoster>) => attendanceApi.rosters.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROSTER_KEY] });
      toast.success("Roster created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to create roster")),
  });
}

export function useDeleteRoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => attendanceApi.rosters.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROSTER_KEY] });
      toast.success("Roster deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete roster")),
  });
}

export function useRosterSlots(rosterId: number | string | null) {
  return useQuery({
    queryKey: [ROSTER_KEY, "slots", rosterId],
    queryFn: () => attendanceApi.rosters.listSlots(rosterId!),
    enabled: !!rosterId,
  });
}

export function useUpsertRosterSlot(rosterId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RosterSlot>) => attendanceApi.rosters.upsertSlot(rosterId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROSTER_KEY, "slots", rosterId] });
      toast.success("Slot saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save slot")),
  });
}

// ---- Overrides ----
const OVERRIDE_KEY = "attendance-overrides";

export function useAttendanceOverrides(params?: ListParams) {
  return useQuery({
    queryKey: [OVERRIDE_KEY, "list", params ?? {}],
    queryFn: () => attendanceApi.listOverrides(params),
  });
}

export function useCreateOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AttendanceOverride>) => attendanceApi.createOverride(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [OVERRIDE_KEY] });
      toast.success("Override created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to create override")),
  });
}
