/**
 * Employee self-service attendance (erp-api /hrm/attendance/me/*). The server resolves the
 * employee from the caller's token, so no employee id is ever sent.
 */

import { apiClient } from "@/lib/api/client";
import { type AttendanceRecord } from "@/lib/api/attendance";
import { orFallback } from "@/lib/api/not-found";
import { type WorkSite } from "@/lib/api/work-sites";

const ME = "/hrm/attendance/me";

export type GeoMode = "off" | "flag" | "block";

export interface MyShift {
  id?: string;
  name?: string;
  start_time?: string;
  end_time?: string;
}

export interface MyAttendanceToday {
  record: AttendanceRecord | null;
  shift: MyShift | null;
  sites: WorkSite[];
  policy: { geo_mode: GeoMode; require_photo: boolean; geo_tolerance_m?: number };
}

export interface ClockPayload {
  lat: number;
  lng: number;
  accuracy_m: number;
  photo_url?: string;
  note?: string;
}

export interface FenceResult {
  inside: boolean;
  distance_m: number;
  site_id?: string;
  site_name?: string;
}

export interface ClockResult {
  record: AttendanceRecord;
  fence: FenceResult | null;
  flagged: boolean;
}

export const attendanceSelfApi = {
  /** Null when the tenant's erp-api does not serve self clock-in yet. */
  today: () => orFallback<MyAttendanceToday | null>(apiClient.get<MyAttendanceToday>(`${ME}/today`), null),
  clockIn: (data: ClockPayload) => apiClient.post<ClockResult>(`${ME}/clock-in`, data),
  clockOut: (data: ClockPayload) => apiClient.post<ClockResult>(`${ME}/clock-out`, data),
  /** Stores a clock-in selfie and returns its URL for the clock payload. */
  uploadPhoto: (file: Blob) => {
    const fd = new FormData();
    fd.append("file", file, "clock-photo.jpg");
    return apiClient.post<{ url: string }>(`${ME}/photo`, fd);
  },
};
