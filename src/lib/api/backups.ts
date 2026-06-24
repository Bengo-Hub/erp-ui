/** Tenant-scoped backups (erp-api) — each call is scoped to the caller's tenant; a
 *  tenant only ever sees/downloads its OWN backups. Replaces the platform-wide dumps. */
import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/drf";

export interface ErpBackup {
  name: string;
  size: number;
  created_at: string;
}

export interface BackupSettings {
  auto_enabled: boolean;
  schedule_hour: number;
  retention_days: number;
}

export const erpBackupsApi = {
  list: () => apiClient.get<Paginated<ErpBackup> | ErpBackup[]>(`/backups`),
  create: () => apiClient.post<ErpBackup>(`/backups`, {}),
  getSettings: () => apiClient.get<BackupSettings>(`/backups/settings`),
  updateSettings: (data: BackupSettings) => apiClient.put<BackupSettings>(`/backups/settings`, data),
  remove: (name: string) => apiClient.delete<void>(`/backups/${encodeURIComponent(name)}`),
  download: async (name: string) => {
    const { blob, fileName } = await apiClient.getBlob(
      `/backups/${encodeURIComponent(name)}/download`,
      name,
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
