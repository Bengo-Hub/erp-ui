"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  approvalDecisionApi,
  attendanceSettingsApi,
  overtimeRequestsApi,
  regularisationsApi,
  type AttendanceSettings,
  type OvertimeInput,
  type RegularisationInput,
  type RequestFilters,
} from "@/lib/api/attendance-requests";
import { extractApiError } from "@/lib/api/error";

const SETTINGS = ["attendance-settings"];
const REG = ["attendance-regularisations"];
const OT = ["attendance-overtime-requests"];

export function useAttendanceSettings() {
  return useQuery({ queryKey: SETTINGS, queryFn: attendanceSettingsApi.get });
}

export function useSaveAttendanceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AttendanceSettings) => attendanceSettingsApi.save(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SETTINGS });
      qc.invalidateQueries({ queryKey: ["attendance", "me", "today"] });
      toast.success("Attendance settings saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not save attendance settings")),
  });
}

export function useRegularisations(filters: RequestFilters) {
  return useQuery({
    queryKey: [...REG, filters],
    queryFn: () => regularisationsApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useCreateRegularisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RegularisationInput) => regularisationsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REG });
      toast.success("Correction requested. It goes to the approver now.");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not request the correction")),
  });
}

export function useOvertimeRequests(filters: RequestFilters) {
  return useQuery({
    queryKey: [...OT, filters],
    queryFn: () => overtimeRequestsApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useCreateOvertimeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OvertimeInput) => overtimeRequestsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OT });
      toast.success("Overtime requested. It goes to the approver now.");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not request overtime")),
  });
}

/** Approve or reject the approvals-engine request behind a correction or overtime request. */
export function useDecideAttendanceRequest(kind: "regularisation" | "overtime") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, approve, comment }: { requestId: string; approve: boolean; comment?: string }) =>
      approve ? approvalDecisionApi.approve(requestId, comment) : approvalDecisionApi.reject(requestId, comment ?? ""),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: kind === "overtime" ? OT : REG });
      qc.invalidateQueries({ queryKey: ["attendance-records"] });
      toast.success(v.approve ? "Approved" : "Rejected");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not record the decision")),
  });
}
