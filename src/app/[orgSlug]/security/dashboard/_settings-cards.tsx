"use client";

import { useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/form";
import { SettingsForm } from "@/components/settings/settings-form";
import {
  use2FA,
  use2FAActions,
  usePasswordPolicy,
  useSavePasswordPolicy,
  useSaveSecuritySettings,
  useSecuritySettings,
} from "@/hooks/use-security";

/** Security settings + password policy + 2FA self-management cards. */
export function SecuritySettingsCards() {
  const settings = useSecuritySettings();
  const saveSettings = useSaveSecuritySettings();
  const policy = usePasswordPolicy();
  const savePolicy = useSavePasswordPolicy();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PermissionGate
        permission="change_securitysettings"
        fallback={
          <SettingsForm
            title="Security settings"
            data={settings.data}
            isLoading={settings.isLoading}
            error={settings.error}
            onRetry={settings.refetch}
            readOnly
            fields={securityFields}
            onSave={() => undefined}
          />
        }
      >
        <SettingsForm
          title="Security settings"
          description="Session & lockout policy applied platform-wide."
          data={settings.data}
          isLoading={settings.isLoading}
          error={settings.error}
          onRetry={settings.refetch}
          saving={saveSettings.isPending}
          fields={securityFields}
          onSave={(v) => saveSettings.mutate(v)}
        />
      </PermissionGate>

      <SettingsForm
        title="Password policy"
        description="Complexity & expiry requirements for all users."
        data={policy.data}
        isLoading={policy.isLoading}
        error={policy.error}
        onRetry={policy.refetch}
        saving={savePolicy.isPending}
        fields={policyFields}
        onSave={(v) => savePolicy.mutate(v)}
      />

      <TwoFactorCard />
    </div>
  );
}

const securityFields = [
  { name: "enforce_2fa", label: "Enforce two-factor", type: "switch" as const, span2: true },
  { name: "session_timeout_minutes", label: "Session timeout (min)", type: "number" as const },
  { name: "max_failed_attempts", label: "Max failed attempts", type: "number" as const },
  { name: "lockout_duration_minutes", label: "Lockout duration (min)", type: "number" as const },
];

const policyFields = [
  { name: "min_length", label: "Minimum length", type: "number" as const },
  { name: "expiry_days", label: "Expiry (days)", type: "number" as const },
  { name: "require_uppercase", label: "Require uppercase", type: "switch" as const },
  { name: "require_lowercase", label: "Require lowercase", type: "switch" as const },
  { name: "require_numbers", label: "Require numbers", type: "switch" as const },
  { name: "require_special", label: "Require special chars", type: "switch" as const },
];

/** Self-service 2FA enable/verify/disable. */
function TwoFactorCard() {
  const { data, isLoading } = use2FA();
  const { setup, verify, disable } = use2FAActions();
  const [code, setCode] = useState("");
  const [confirmDisable, setConfirmDisable] = useState(false);

  const enabled = data?.enabled;
  const qr = setup.data?.qr_code;

  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold text-foreground">Two-factor authentication</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Add a second factor to your own account.
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : enabled ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-green-600">Two-factor is enabled on your account.</p>
          <Button size="sm" variant="destructive" onClick={() => setConfirmDisable(true)}>
            Disable 2FA
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {!qr ? (
            <Button size="sm" onClick={() => setup.mutate()} disabled={setup.isPending}>
              {setup.isPending ? "Starting…" : "Set up 2FA"}
            </Button>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="2FA QR code" className="h-40 w-40 rounded border border-border" />
              <Field label="Verification code" htmlFor="twofa-code">
                <Input id="twofa-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
              </Field>
              <Button size="sm" onClick={() => verify.mutate(code)} disabled={verify.isPending || !code}>
                {verify.isPending ? "Verifying…" : "Verify & enable"}
              </Button>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDisable}
        title="Disable two-factor?"
        description="Your account will be less secure."
        destructive
        loading={disable.isPending}
        onCancel={() => setConfirmDisable(false)}
        onConfirm={() => disable.mutate(undefined, { onSuccess: () => setConfirmDisable(false) })}
      />
    </Card>
  );
}
