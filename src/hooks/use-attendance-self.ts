"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { attendanceSelfApi, type ClockPayload, type ClockResult } from "@/lib/api/attendance-self";
import { extractApiError } from "@/lib/api/error";

const KEY = ["attendance", "me", "today"];

/** The signed-in employee's record, shift, work sites and clock-in policy for today. */
export function useMyAttendanceToday() {
  return useQuery({ queryKey: KEY, queryFn: attendanceSelfApi.today, retry: 1, refetchOnWindowFocus: true });
}

/** Clock in or out. The result carries the fence check, so the card can explain a flagged punch. */
export function useClock(direction: "in" | "out") {
  const qc = useQueryClient();
  return useMutation<ClockResult, unknown, ClockPayload>({
    mutationFn: (data) => (direction === "in" ? attendanceSelfApi.clockIn(data) : attendanceSelfApi.clockOut(data)),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["attendance-records"] });
      const verb = direction === "in" ? "Clocked in" : "Clocked out";
      if (res.flagged) toast.warning(`${verb}. Your manager will review it because you were outside your work site.`);
      else toast.success(res.fence?.site_name ? `${verb} at ${res.fence.site_name}` : verb);
    },
    onError: (e) => toast.error(extractApiError(e, direction === "in" ? "Could not clock in" : "Could not clock out")),
  });
}

export function useUploadClockPhoto() {
  return useMutation({
    mutationFn: (file: Blob) => attendanceSelfApi.uploadPhoto(file),
    onError: (e) => toast.error(extractApiError(e, "Could not upload the photo")),
  });
}
