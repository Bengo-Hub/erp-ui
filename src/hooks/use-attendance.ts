"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  attendanceApi,
  type AttendanceRecord,
  type OffDay,
  type ShiftAssignment,
  type ShiftRotation,
  type Timesheet,
  type WorkShift,
} from "@/lib/api/attendance";
import { type ListParams } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";
import { makeActionHook, makeResourceHooks } from "@/hooks/use-crud-resource";

const records = makeResourceHooks<AttendanceRecord>("attendance-records", attendanceApi.records, "Attendance record");
export const useAttendanceRecords = records.useList;
export const useSaveAttendanceRecord = records.useSave;
export const useDeleteAttendanceRecord = records.useRemove;

const shifts = makeResourceHooks<WorkShift>("work-shifts", attendanceApi.workShifts, "Work shift");
export const useWorkShifts = shifts.useList;
export const useWorkShift = shifts.useDetail;
export const useSaveWorkShift = shifts.useSave;
export const useDeleteWorkShift = shifts.useRemove;

const rotations = makeResourceHooks<ShiftRotation>("shift-rotations", attendanceApi.rotations, "Shift rotation");
export const useShiftRotations = rotations.useList;
export const useShiftRotation = rotations.useDetail;
export const useSaveShiftRotation = rotations.useSave;
export const useDeleteShiftRotation = rotations.useRemove;

const offDays = makeResourceHooks<OffDay>("off-days", attendanceApi.offDays, "Off day");
export const useOffDays = offDays.useList;
export const useSaveOffDay = offDays.useSave;
export const useDeleteOffDay = offDays.useRemove;

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
    mutationFn: ({ id, data }: { id?: number; data: Partial<Timesheet> }) =>
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
    mutationFn: (id: number) => attendanceApi.timesheets.remove(id),
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
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
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
    mutationFn: (id: number) => attendanceApi.deleteAssignment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift-assignments"] });
      qc.invalidateQueries({ queryKey: ["shift-planner"] });
      toast.success("Assignment removed");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to remove assignment")),
  });
}
