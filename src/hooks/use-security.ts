"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api/error";
import {
  backupsApi,
  securityApi,
  type BackupSchedule,
  type PasswordPolicy,
  type SecuritySettings,
} from "@/lib/api/security";

/* ---- Security dashboard / settings ---- */
export function useSecurityDashboard() {
  return useQuery({ queryKey: ["security", "dashboard"], queryFn: securityApi.dashboard });
}

export function useSecuritySettings() {
  return useQuery({ queryKey: ["security", "settings"], queryFn: securityApi.getSettings });
}

export function useSaveSecuritySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SecuritySettings>) => securityApi.updateSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security", "settings"] });
      toast.success("Security settings saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save security settings")),
  });
}

export function usePasswordPolicy() {
  return useQuery({ queryKey: ["security", "password-policy"], queryFn: securityApi.getPasswordPolicy });
}

export function useSavePasswordPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PasswordPolicy>) => securityApi.updatePasswordPolicy(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security", "password-policy"] });
      toast.success("Password policy saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save password policy")),
  });
}

/* ---- 2FA ---- */
export function use2FA() {
  return useQuery({ queryKey: ["security", "2fa"], queryFn: securityApi.get2FA });
}

export function use2FAActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["security", "2fa"] });
  const setup = useMutation({
    mutationFn: () => securityApi.setup2FA(),
    onError: (e) => toast.error(extractApiError(e, "Failed to start 2FA setup")),
  });
  const verify = useMutation({
    mutationFn: (code: string) => securityApi.verify2FA(code),
    onSuccess: () => { invalidate(); toast.success("Two-factor authentication enabled"); },
    onError: (e) => toast.error(extractApiError(e, "Invalid verification code")),
  });
  const disable = useMutation({
    mutationFn: () => securityApi.disable2FA(),
    onSuccess: () => { invalidate(); toast.success("Two-factor authentication disabled"); },
    onError: (e) => toast.error(extractApiError(e, "Failed to disable 2FA")),
  });
  return { setup, verify, disable };
}

/* ---- Backups ---- */
export function useBackups() {
  return useQuery({ queryKey: ["backups", "list"], queryFn: () => backupsApi.list() });
}

export function useBackupActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["backups"] });
  const create = useMutation({
    mutationFn: (type: string) => backupsApi.create(type),
    onSuccess: () => { invalidate(); toast.success("Backup started"); },
    onError: (e) => toast.error(extractApiError(e, "Failed to create backup")),
  });
  const remove = useMutation({
    mutationFn: (id: number | string) => backupsApi.remove(id),
    onSuccess: () => { invalidate(); toast.success("Backup deleted"); },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete backup")),
  });
  const restore = useMutation({
    mutationFn: (id: number | string) => backupsApi.restore(id),
    onSuccess: () => toast.success("Restore started"),
    onError: (e) => toast.error(extractApiError(e, "Failed to restore backup")),
  });
  const download = useMutation({
    mutationFn: (id: number | string) => backupsApi.download(id),
    onSuccess: ({ blob, fileName }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to download backup")),
  });
  return { create, remove, restore, download };
}

export function useBackupSchedule() {
  return useQuery({ queryKey: ["backups", "schedule"], queryFn: backupsApi.getSchedule });
}

export function useSaveBackupSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BackupSchedule>) => backupsApi.updateSchedule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backups", "schedule"] });
      toast.success("Backup schedule saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save schedule")),
  });
}
