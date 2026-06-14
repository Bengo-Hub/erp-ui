"use client";

import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsForm, type SettingsFieldDef } from "@/components/settings/settings-form";
import { useRegionalSettings, useSaveRegionalSettings } from "@/hooks/use-settings";

import { SettingsTabs } from "../_tabs";

const CURRENCIES = [
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "UGX", label: "UGX — Ugandan Shilling" },
  { value: "TZS", label: "TZS — Tanzanian Shilling" },
];

const TIMEZONES = [
  { value: "Africa/Nairobi", label: "(GMT+03:00) Nairobi" },
  { value: "Africa/Kampala", label: "(GMT+03:00) Kampala" },
  { value: "Africa/Dar_es_Salaam", label: "(GMT+03:00) Dar es Salaam" },
  { value: "UTC", label: "(GMT+00:00) UTC" },
];

const DATE_FORMATS = [
  { value: "dd/mm/yyyy", label: "dd/mm/yyyy" },
  { value: "mm/dd/yyyy", label: "mm/dd/yyyy" },
  { value: "yyyy-mm-dd", label: "yyyy-mm-dd" },
];

const fields: SettingsFieldDef[] = [
  { name: "default_currency", label: "Default currency", type: "select", options: CURRENCIES },
  { name: "timezone", label: "Timezone", type: "select", options: TIMEZONES },
  { name: "date_format", label: "Date format", type: "select", options: DATE_FORMATS },
  {
    name: "time_format",
    label: "Time format",
    type: "select",
    options: [
      { value: "24h", label: "24-hour" },
      { value: "12h", label: "12-hour" },
    ],
  },
  { name: "fiscal_year_start", label: "Fiscal year start", type: "date" },
];

export default function CurrencyTimePage() {
  const { settings, isLoading, error, refetch } = useRegionalSettings();
  const save = useSaveRegionalSettings();

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Settings" subtitle="Currency, timezone & locale formats" />
      <SettingsTabs active="currency-time" />

      <PermissionGate
        permission="change_regionalsettings"
        fallback={
          <SettingsForm
            title="Regional settings"
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
          title="Regional settings"
          description="Applied across reports, payslips and document formatting."
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
