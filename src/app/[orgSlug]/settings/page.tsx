"use client";

import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsForm, type SettingsFieldDef } from "@/components/settings/settings-form";
import { useBusinessSettings, useSaveBusinessSettings } from "@/hooks/use-settings";

import { SettingsTabs } from "./_tabs";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((m, i) => ({ value: String(i + 1), label: m }));

const TIMEZONES = [
  "Africa/Nairobi", "Africa/Lagos", "Africa/Cairo", "Africa/Johannesburg",
  "Africa/Accra", "Africa/Kampala", "Africa/Dar_es_Salaam", "UTC", "Europe/London",
].map((z) => ({ value: z, label: z }));

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
  // Regional & fiscal defaults (per-tenant CompanySettings; PUT /business/settings).
  { name: "timezone", label: "Time zone", type: "select", options: TIMEZONES },
  {
    name: "date_format", label: "Date format", type: "select",
    options: [
      { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
      { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
      { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
      { value: "DD MMM YYYY", label: "DD MMM YYYY" },
    ],
  },
  {
    name: "time_format", label: "Time format", type: "select",
    options: [
      { value: "HH:mm", label: "24-hour (HH:mm)" },
      { value: "hh:mm A", label: "12-hour (hh:mm AM/PM)" },
    ],
  },
  { name: "financial_year_start_month", label: "Fiscal year start", type: "select", options: MONTHS },
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
