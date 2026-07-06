"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent, CardHeader } from "@/components/ui/base";
import { Switch } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import {
  generalHrSingleton,
  useGeneralHrSettings,
  useSaveGeneralHrSettings,
} from "@/hooks/use-payroll-settings";
import { type GeneralHrSettings } from "@/lib/api/payroll-settings";

import { usePayrollSettingsTabs } from "../_tabs";

type FormValues = Record<string, boolean | undefined>;

const TOGGLES: { key: keyof GeneralHrSettings; label: string; hint: string }[] = [
  { key: "paye_enabled", label: "PAYE (Income Tax)", hint: "Withheld from employees and remitted to KRA monthly." },
  { key: "nssf_enabled", label: "NSSF", hint: "Pension contribution, matched by the employer." },
  { key: "shif_enabled", label: "SHIF / NHIF", hint: "Health contribution (2.75% of gross), employee-only." },
  { key: "housing_levy_enabled", label: "Housing Levy", hint: "1.5% of gross, matched by the employer." },
  { key: "nita_enabled", label: "NITA Levy", hint: "Employer-only training levy (KES 50/employee/month)." },
];

export default function StatutorySettingsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { tabs, active, onChange } = usePayrollSettingsTabs("statutory");
  const { data, isLoading } = useGeneralHrSettings();
  const save = useSaveGeneralHrSettings();
  const current = generalHrSingleton(data);

  const { handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    // Default ON: disabled statutory deductions are the exception, not the rule.
    defaultValues: Object.fromEntries(TOGGLES.map((t) => [t.key, true])),
  });

  useEffect(() => {
    if (current) {
      reset(Object.fromEntries(TOGGLES.map((t) => [t.key, current[t.key] !== false])));
    }
  }, [current, reset]);

  const onSubmit = (v: FormValues) => {
    save.mutate({ id: current?.id, data: v as Partial<GeneralHrSettings> });
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Payroll Settings"
        subtitle="Tax & statutory configuration (ERP-owned, tenant-configurable)"
      />
      <Tabs tabs={tabs} active={active} onChange={onChange} />

      {isLoading ? (
        <LoadingState />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-foreground">Statutory Deductions</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Disabled deductions are skipped entirely when payroll is processed. All
                registered Kenyan employers must remit these — only turn one off if it
                genuinely doesn&apos;t apply to your business.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {TOGGLES.map((t) => {
                const checked = watch(t.key as string);
                return (
                  <div
                    key={t.key as string}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                  >
                    <div>
                      <span className="text-sm font-medium text-foreground">{t.label}</span>
                      <p className="text-xs text-muted-foreground">{t.hint}</p>
                    </div>
                    <Switch
                      checked={!!checked}
                      onChange={(c) => setValue(t.key as string, c, { shouldDirty: true })}
                      id={t.key as string}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Rates, bands and reliefs (PAYE bands, NSSF tiers, SHIF/Housing rates, personal
                relief) are managed in{" "}
                <Link
                  href={`/${orgSlug}/settings/payroll/formulas`}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Formulas
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          <PermissionGate
            permission={["change_defaultpayrollsettings", "add_defaultpayrollsettings"]}
            fallback={
              <p className="text-sm text-muted-foreground">
                You don&apos;t have permission to change statutory settings.
              </p>
            }
          >
            <div className="flex justify-end">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save Settings"}
              </Button>
            </div>
          </PermissionGate>
        </form>
      )}
    </div>
  );
}
