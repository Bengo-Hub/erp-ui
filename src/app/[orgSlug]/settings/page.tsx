"use client";

import { ExternalLink } from "lucide-react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { SettingsForm, type SettingsFieldDef } from "@/components/settings/settings-form";
import { Button, Card } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/states";
import { EXTERNAL_SERVICES } from "@/config/external-services";
import { useBusinessSettings, useSaveBusinessSettings, useTenantProfile } from "@/hooks/use-settings";

import { SettingsTabs } from "./_tabs";

// Company identity (name, KRA PIN, contacts, country, logo) is owned by the accounts service and
// shared by every Codevertex app, so it is shown read-only here and edited there. The ERP keeps
// only what payroll documents need beyond that. Regional settings live on the Currency & Time tab.
// The accounts portal edits name, contacts, KRA PIN and logo on My organisation > Branding.
const PROFILE_EDIT_URL = `${EXTERNAL_SERVICES.auth}/dashboard/my-tenant?tab=branding`;

const employerFields: SettingsFieldDef[] = [
  { name: "legal_name", label: "Registered (legal) name", span2: true },
  { name: "nssf_employer_no", label: "NSSF employer number" },
  { name: "shif_employer_no", label: "SHIF employer number" },
  { name: "postal_address", label: "Postal address" },
  { name: "physical_address", label: "Physical address" },
];

function ProfileRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || <span className="text-muted-foreground">Not set</span>}</dd>
    </div>
  );
}

function CompanyProfileCard() {
  const { data, isLoading } = useTenantProfile();
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Company profile</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            From your Codevertex account and shared by all your apps. Payslips, P9 and P10 use these details.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => window.open(PROFILE_EDIT_URL, "_blank", "noopener")}>
          <ExternalLink className="mr-1.5 size-4" /> Edit in accounts portal
        </Button>
      </div>
      {isLoading ? (
        <div className="mt-4"><LoadingState /></div>
      ) : (
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileRow label="Business name" value={data?.name} />
          <ProfileRow label="KRA PIN" value={data?.tax_pin} />
          <ProfileRow label="Country" value={data?.country} />
          <ProfileRow label="Email" value={data?.contact_email} />
          <ProfileRow label="Phone" value={data?.contact_phone} />
          <ProfileRow label="Website" value={data?.website} />
        </dl>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  const { settings, isLoading, error, refetch } = useBusinessSettings();
  const save = useSaveBusinessSettings();
  const form = (readOnly: boolean) => (
    <SettingsForm
      title="Employer details for payroll"
      description="Kept by the ERP for statutory returns and payslips, in addition to the company profile above."
      data={settings}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      readOnly={readOnly}
      saving={save.isPending}
      fields={employerFields}
      onSave={readOnly ? () => undefined : (v) => save.mutate({ id: settings?.id, data: v })}
    />
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Settings" subtitle="Company profile and payroll employer details" />
      <SettingsTabs active="company" />
      <CompanyProfileCard />
      <PermissionGate permission="change_business" fallback={form(true)}>
        {form(false)}
      </PermissionGate>
    </div>
  );
}
