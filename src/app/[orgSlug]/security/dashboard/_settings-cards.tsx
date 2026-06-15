"use client";

import { useState } from "react";

import { Button, Card } from "@/components/ui/base";
import { Field, Input } from "@/components/ui/form";
import { use2FAActions } from "@/hooks/use-security";

/** Self-service 2FA setup card (auth-api /auth/mfa/totp/*). */
export function SecuritySettingsCards() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <TwoFactorCard />
    </div>
  );
}

/**
 * Enroll a TOTP authenticator. auth-api returns the raw secret + an otpauth://
 * provisioning URI (no server-rendered QR), then verifies the first code.
 */
function TwoFactorCard() {
  const { start, confirm, regenerateBackupCodes } = use2FAActions();
  const [code, setCode] = useState("");

  const secret = start.data?.secret;
  const provisioning = start.data?.provisioning;
  const enabled = confirm.isSuccess;
  const backupCodes = regenerateBackupCodes.data?.backup_codes;

  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold text-foreground">Two-factor authentication</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Add a second factor to your own account.
      </p>

      {enabled ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-green-600">Two-factor is enabled on your account.</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => regenerateBackupCodes.mutate()}
            disabled={regenerateBackupCodes.isPending}
          >
            {regenerateBackupCodes.isPending ? "Generating…" : "Regenerate backup codes"}
          </Button>
          {backupCodes && backupCodes.length > 0 && (
            <div className="rounded border border-border bg-muted/40 p-3">
              <p className="mb-1 text-xs font-medium text-foreground">
                Save these backup codes — they are shown once:
              </p>
              <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                {backupCodes.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {!secret ? (
            <Button size="sm" onClick={() => start.mutate()} disabled={start.isPending}>
              {start.isPending ? "Starting…" : "Set up 2FA"}
            </Button>
          ) : (
            <>
              <div className="rounded border border-border bg-muted/40 p-3 text-xs">
                <p className="mb-1 font-medium text-foreground">
                  Add this account to your authenticator app:
                </p>
                <p className="break-all">
                  Secret: <code className="font-mono">{secret}</code>
                </p>
                {provisioning && (
                  <p className="mt-1 break-all text-muted-foreground">
                    Or open: <code className="font-mono">{provisioning}</code>
                  </p>
                )}
              </div>
              <Field label="Verification code" htmlFor="twofa-code">
                <Input
                  id="twofa-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                />
              </Field>
              <Button
                size="sm"
                onClick={() => confirm.mutate(code)}
                disabled={confirm.isPending || !code}
              >
                {confirm.isPending ? "Verifying…" : "Verify & enable"}
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
