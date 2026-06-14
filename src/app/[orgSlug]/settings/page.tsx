"use client";

import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsForm, type SettingsFieldDef } from "@/components/settings/settings-form";
import { useBusinessSettings, useSaveBusinessSettings } from "@/hooks/use-settings";

import { SettingsTabs } from "./_tabs";

const fields: SettingsFieldDef[] = [
  { name: "name", label: "Business name", span2: true },
  { name: "legal_name", label: "Legal name" },
  { name: "kra_pin", label: "KRA PIN" },
  { name: "registration_number", label: "Registration number" },
  { name: "email", label: "Email" },
  { name: "phone", label: "Phone" },
  { name: "website", label: "Website" },
  { name: "address", label: "Address", span2: true },
  { name: "city", label: "City" },
  { name: "country", label: "Country" },
];

export default function SettingsPage() {
  const { settings, isLoading, error, refetch } = useBusinessSettings();
  const save = useSaveBusinessSettings();

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Settings" subtitle="Company profile & system configuration" />
      <SettingsTabs active="company" />

      <PermissionGate
        permission="change_business"
        fallback={
          <SettingsForm
            title="Company information"
            data={settings}
            isLoading={isLoading}
            error={error}
            onRetry={refetch}
            readOnly
            fields={fields}
            onSave={() => undefined}
          />
        }
      >
        <SettingsForm
          title="Company information"
          description="Used on payslips, reports and statutory documents."
          data={settings}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          saving={save.isPending}
          fields={fields}
          onSave={(v) => save.mutate({ id: settings?.id, data: v })}
        />
      </PermissionGate>
    </div>
  );
}
