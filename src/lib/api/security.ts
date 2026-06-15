/**
 * Security features backed by auth-api (SSO).
 *
 * auth-api provides ONLY:
 *  - Self-service 2FA (TOTP):  POST /auth/mfa/totp/start    → {secret, provisioning(otpauth URL)}
 *                              POST /auth/mfa/totp/confirm  {code}
 *                              POST /auth/mfa/backup-codes/regenerate → {backup_codes[]}
 *  - Platform DB backups (read-only): GET /admin/backups          → {backups:[{filename,size,created_at}]}
 *                                     GET /admin/backups/{filename} → file stream
 *
 * REPORTED AS MISSING (no auth-api endpoint — see report):
 *  - Security dashboard stats / recent events
 *  - Audit-log feed
 *  - Tenant security settings (session timeout, lockout, enforce-2fa)
 *  - Password policy (min length / complexity / expiry)
 *  - Account unlock
 *  - 2FA status read + disable, backup create/delete/restore/schedule
 * These helpers either return empty/typed-null so the UI degrades gracefully, or
 * are omitted; the consuming UI is gated/annotated accordingly.
 */

import { authAdminClient } from "@/lib/api/auth-admin-client";

export interface TwoFactorStartResponse {
  /** Raw TOTP secret (base32). */
  secret?: string;
  /** otpauth:// provisioning URI — render as a QR client-side. */
  provisioning?: string;
  [key: string]: unknown;
}

export const securityApi = {
  /* ---- Self-service 2FA (TOTP) ---- */
  start2FA: () => authAdminClient.post<TwoFactorStartResponse>(`/auth/mfa/totp/start`),
  confirm2FA: (code: string) =>
    authAdminClient.post<{ status: string }>(`/auth/mfa/totp/confirm`, { code }),
  regenerateBackupCodes: () =>
    authAdminClient.post<{ backup_codes: string[] }>(`/auth/mfa/backup-codes/regenerate`, {}),
};
