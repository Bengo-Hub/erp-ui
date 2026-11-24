/**
 * Biometric devices (ZKTeco push), their command queue, raw punches and door access events.
 * erp-api /hrm/attendance/{devices,punches,access-events}; list envelope {data,total,page,limit}.
 */

import { apiClient } from "@/lib/api/client";
import { type Paginated } from "@/lib/api/drf";
import { emptyPage, orFallback } from "@/lib/api/not-found";

const ATT = "/hrm/attendance";

export type DeviceMode = "ta" | "ac";

export interface AttendanceDevice {
  id: string;
  serial: string;
  name: string;
  outlet_id?: string | null;
  work_site_id?: string | null;
  mode: DeviceMode;
  active: boolean;
  timezone?: string | null;
  last_seen_at?: string | null;
  firmware?: string | null;
  user_count?: number;
  punch_count_today?: number;
  /** Door events today; an access-control (mode "ac") device reports these instead of punches. */
  event_count_today?: number;
  /** The device's work site name and that site's branch, for devices without a branch of their own. */
  work_site_name?: string;
  site_outlet_id?: string | null;
  online?: boolean;
  /** Addresses allowed to push as this device; empty means any address. */
  allowed_cidrs?: string[];
  has_comm_key?: boolean;
}

export type DeviceInput = Pick<AttendanceDevice, "serial" | "name" | "mode" | "active"> & {
  outlet_id?: string | null;
  work_site_id?: string | null;
  timezone?: string | null;
  allowed_cidrs?: string[];
};

export type DeviceCommandType = "sync_users" | "open_door" | "reboot" | "reload_logs" | "clear_logs";

export interface DeviceCommand {
  id: string;
  device_id: string;
  type: DeviceCommandType;
  status: "queued" | "sent" | "done" | "failed";
  result?: string | null;
  created_at?: string;
  sent_at?: string | null;
  completed_at?: string | null;
  created_by_name?: string | null;
}

export interface AttendancePunch {
  id: string;
  device_id?: string | null;
  device_name?: string | null;
  device_sn?: string | null;
  device_pin?: string | null;
  employee_id?: string | null;
  employee_name?: string | null;
  punched_at: string;
  verify_mode?: string | null;
  source: "device" | "mobile" | "web" | "manual";
  /** Set once the punch is paired into an attendance record. */
  record_id?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface AccessEvent {
  id: string;
  device_id?: string | null;
  device_name?: string | null;
  door?: string | null;
  employee_id?: string | null;
  employee_name?: string | null;
  device_pin?: string | null;
  result: "granted" | "denied";
  verify_mode?: string | null;
  reason?: string | null;
  occurred_at: string;
}

export interface PunchFilters {
  from?: string;
  to?: string;
  device_id?: string;
  employee_id?: string;
  unmatched?: boolean;
  page?: number;
  limit?: number;
}

export interface AccessFilters {
  from?: string;
  to?: string;
  device_id?: string;
  result?: "granted" | "denied";
  door?: string;
  page?: number;
  limit?: number;
}

const list = <T>(url: string, params?: object) =>
  orFallback(apiClient.get<Paginated<T>>(url, params), emptyPage<T>());

export const devicesApi = {
  list: (params?: object) => list<AttendanceDevice>(`${ATT}/devices`, params),
  create: (data: DeviceInput) => apiClient.post<AttendanceDevice>(`${ATT}/devices`, data),
  update: (id: string, data: Partial<DeviceInput>) => apiClient.patch<AttendanceDevice>(`${ATT}/devices/${id}`, data),
  remove: (id: string) => apiClient.delete<void>(`${ATT}/devices/${id}`),
  commands: (id: string, params?: object) => list<DeviceCommand>(`${ATT}/devices/${id}/commands`, params),
  sendCommand: (id: string, type: DeviceCommandType) =>
    apiClient.post<DeviceCommand>(`${ATT}/devices/${id}/commands`, { type }),
};

export const punchesApi = {
  list: (params?: PunchFilters) => list<AttendancePunch>(`${ATT}/punches`, params),
};

export const accessEventsApi = {
  list: (params?: AccessFilters) => list<AccessEvent>(`${ATT}/access-events`, params),
};

/** The employee's user PIN on the devices (stored in employee metadata, unique per tenant). */
export const devicePinApi = {
  set: (employeeId: string | number, pin: string) =>
    apiClient.put<{ device_pin: string }>(`/hrm/employees/${employeeId}/device-pin`, { pin }),
};

export const COMMAND_LABELS: Record<DeviceCommandType, string> = {
  sync_users: "Sync users",
  open_door: "Open door",
  reboot: "Reboot",
  reload_logs: "Reload logs",
  clear_logs: "Clear logs",
};
