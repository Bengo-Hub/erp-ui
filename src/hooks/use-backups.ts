"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { erpBackupsApi, type BackupSettings } from "@/lib/api/backups";
import { extractApiError } from "@/lib/api/error";

const KEY = ["backups", "erp"] as const;
const SETTINGS_KEY = ["backups", "erp", "settings"] as const;

export function useErpBackups() {
  return useQuery({ queryKey: KEY, queryFn: () => erpBackupsApi.list() });
}

export function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => erpBackupsApi.create(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Backup created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to create backup")),
  });
}

export function useDeleteBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => erpBackupsApi.remove(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Backup deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete backup")),
  });
}

export function useDownloadBackup() {
  return useMutation({
    mutationFn: (name: string) => erpBackupsApi.download(name),
    onError: (e) => toast.error(extractApiError(e, "Download failed")),
  });
}

export function useBackupSettings() {
  return useQuery({ queryKey: SETTINGS_KEY, queryFn: () => erpBackupsApi.getSettings() });
}

export function useUpdateBackupSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BackupSettings) => erpBackupsApi.updateSettings(data),
    onSuccess: (saved) => {
      qc.setQueryData(SETTINGS_KEY, saved);
      toast.success("Backup schedule saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save backup schedule")),
  });
}
