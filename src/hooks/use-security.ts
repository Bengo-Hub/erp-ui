"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api/error";
import { backupsApi, securityApi } from "@/lib/api/security";

/* ---- Self-service 2FA (auth-api /auth/mfa/*) ---- */

export function use2FAActions() {
  const start = useMutation({
    mutationFn: () => securityApi.start2FA(),
    onError: (e) => toast.error(extractApiError(e, "Failed to start 2FA setup")),
  });
  const confirm = useMutation({
    mutationFn: (code: string) => securityApi.confirm2FA(code),
    onSuccess: () => toast.success("Two-factor authentication enabled"),
    onError: (e) => toast.error(extractApiError(e, "Invalid verification code")),
  });
  const regenerateBackupCodes = useMutation({
    mutationFn: () => securityApi.regenerateBackupCodes(),
    onSuccess: () => toast.success("Backup codes regenerated"),
    onError: (e) => toast.error(extractApiError(e, "Failed to regenerate backup codes")),
  });
  return { start, confirm, regenerateBackupCodes };
}

/* ---- Platform backups (auth-api /admin/backups, read-only) ---- */

export function useBackups() {
  return useQuery({ queryKey: ["backups", "list"], queryFn: () => backupsApi.list() });
}
