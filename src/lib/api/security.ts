/** erp-api security dashboard, 2FA, settings, password policy & backups. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

export interface SecurityDashboard {
  total_users?: number;
  active_users?: number;
  locked_accounts?: number;
  failed_logins_24h?: number;
  two_factor_enabled?: number;
  recent_events?: SecurityEvent[];
  [key: string]: unknown;
}

export interface SecurityEvent {
  id?: number;
  event_type?: string;
  user?: string;
  ip_address?: string;
  timestamp?: string;
  detail?: string;
  [key: string]: unknown;
}

export interface SecuritySettings {
  enforce_2fa?: boolean;
  session_timeout_minutes?: number;
  max_failed_attempts?: number;
  lockout_duration_minutes?: number;
  [key: string]: unknown;
}

export interface PasswordPolicy {
  min_length?: number;
  require_uppercase?: boolean;
  require_lowercase?: boolean;
  require_numbers?: boolean;
  require_special?: boolean;
  expiry_days?: number;
  [key: string]: unknown;
}

export interface TwoFactorStatus {
  enabled?: boolean;
  method?: string;
  qr_code?: string;
  secret?: string;
  [key: string]: unknown;
}

export interface Backup {
  id: number;
  name?: string;
  type?: string;
  status?: string;
  size?: string | number;
  created_at?: string;
  location?: string;
  [key: string]: unknown;
}

export interface BackupSchedule {
  id?: number;
  enabled?: boolean;
  frequency?: string;
  time?: string;
  retention_days?: number;
  [key: string]: unknown;
}

export const securityApi = {
  dashboard: () => apiClient.get<SecurityDashboard>(`/auth/security/dashboard/`),
  auditLogs: (params?: ListParams) =>
    apiClient.get<Paginated<SecurityEvent> | SecurityEvent[]>(`/auth/security/audit-logs/`, params),
  getSettings: () => apiClient.get<SecuritySettings>(`/auth/security/settings/`),
  updateSettings: (data: Partial<SecuritySettings>) =>
    apiClient.put<SecuritySettings>(`/auth/security/settings/`, data),
  unlockAccount: (userId: number | string) =>
    apiClient.post<void>(`/auth/security/unlock-account/`, { user_id: userId }),

  getPasswordPolicy: () => apiClient.get<PasswordPolicy>(`/auth/password-policy/`),
  updatePasswordPolicy: (data: Partial<PasswordPolicy>) =>
    apiClient.post<PasswordPolicy>(`/auth/password-policy/`, data),

  get2FA: () => apiClient.get<TwoFactorStatus>(`/auth/security/2fa/`),
  setup2FA: () => apiClient.post<TwoFactorStatus>(`/auth/security/2fa/`),
  verify2FA: (code: string) =>
    apiClient.post<void>(`/auth/security/2fa/verify/`, { verification_code: code }),
  disable2FA: () => apiClient.post<void>(`/auth/security/2fa/disable/`),
};

export const backupsApi = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<Backup> | Backup[]>(`/auth/backups/`, params),
  create: (type: string) => apiClient.post<Backup>(`/auth/backups/`, { type }),
  remove: (id: number | string) => apiClient.delete<void>(`/auth/backups/${id}/`),
  restore: (id: number | string) => apiClient.post<void>(`/auth/backups/${id}/`, { confirm: true }),
  download: (id: number | string) =>
    apiClient.getBlob(`/auth/backups/${id}/`, `backup-${id}.sql`, { action: "download" }),
  getSchedule: () => apiClient.get<BackupSchedule>(`/auth/backups/schedule/`),
  updateSchedule: (data: Partial<BackupSchedule>) =>
    apiClient.put<BackupSchedule>(`/auth/backups/schedule/`, data),
};
