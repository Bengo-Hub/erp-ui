"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent, CardHeader } from "@/components/ui/base";
import { Field, Input, Switch } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useGeneralHrSettings, useSaveGeneralHrSettings } from "@/hooks/use-payroll-settings";
import { normalizeList } from "@/lib/api/drf";
import { type GeneralHrSettings } from "@/lib/api/payroll-settings";

import { usePayrollSettingsTabs } from "../_tabs";

type FormValues = Record<string, string | boolean | undefined>;

const TOGGLES: { key: keyof GeneralHrSettings; label: string }[] = [
  { key: "paye_enabled", label: "PAYE (Income Tax)" },
  { key: "nssf_enabled", label: "NSSF" },
  { key: "shif_enabled", label: "SHIF / NHIF" },
  { key: "housing_levy_enabled", label: "Housing Levy" },
  { key: "nita_enabled", label: "NITA Levy" },
];

function singleton(data: unknown): GeneralHrSettings | undefined {
  if (Array.isArray(data) || (data && typeof data === "object" && "results" in (data as object))) {
    return normalizeList<GeneralHrSettings>(data as never).results[0];
  }
  return (data as GeneralHrSettings) || undefined;
}

export default function StatutorySettingsPage() {
  const { tabs, active, onChange } = usePayrollSettingsTabs("statutory");
  const { data, isLoading } = useGeneralHrSettings();
  const save = useSaveGeneralHrSettings();
  const current = singleton(data);

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>();

  useEffect(() => {
    if (current) {
      reset({
        personal_relief: current.personal_relief != null ? String(current.personal_relief) : "",
        insurance_relief_rate:
          current.insurance_relief_rate != null ? String(current.insurance_relief_rate) : "",
        housing_levy_rate: current.housing_levy_rate != null ? String(current.housing_levy_rate) : "",
        shif_rate: current.shif_rate != null ? String(current.shif_rate) : "",
        ...Object.fromEntries(TOGGLES.map((t) => [t.key, current[t.key] !== false])),
      });
    }
  }, [current, reset]);

  const onSubmit = (v: FormValues) => {
    const payload: Partial<GeneralHrSettings> = { ...(v as Partial<GeneralHrSettings>) };
    Object.keys(payload).forEach((k) => {
      const val = (payload as Record<string, unknown>)[k];
      if (val === "") delete (payload as Record<string, unknown>)[k];
    });
    save.mutate({ id: current?.id, data: payload });
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
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {TOGGLES.map((t) => {
                const checked = watch(t.key as string);
                return (
                  <div
                    key={t.key as string}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <span className="text-sm font-medium text-foreground">{t.label}</span>
                    <Switch
                      checked={!!checked}
                      onChange={(c) => setValue(t.key as string, c)}
                      id={t.key as string}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-foreground">Relief & Rates</h3>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Personal Relief (monthly)">
                <Input type="number" step="0.01" {...register("personal_relief")} />
              </Field>
              <Field label="Insurance Relief Rate (%)">
                <Input type="number" step="0.01" {...register("insurance_relief_rate")} />
              </Field>
              <Field label="Housing Levy Rate (%)">
                <Input type="number" step="0.01" {...register("housing_levy_rate")} />
              </Field>
              <Field label="SHIF Rate (%)">
                <Input type="number" step="0.01" {...register("shif_rate")} />
              </Field>
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
