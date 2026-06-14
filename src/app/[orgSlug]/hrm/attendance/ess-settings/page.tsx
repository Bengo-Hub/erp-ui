"use client";

import { useState } from "react";

import { Button, Card, CardContent } from "@/components/ui/base";
import { Field, Input, Switch } from "@/components/ui/form";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { PermissionGate } from "@/components/auth/permission-gate";
import { useGeneralHrSettings, useSaveGeneralHrSettings } from "@/hooks/use-payroll-settings";
import { type GeneralHrSettings } from "@/lib/api/payroll-settings";
import { normalizeList } from "@/lib/api/drf";

/** Resolve the single general-HR settings record from the various envelopes. */
function pickSettings(data: unknown): GeneralHrSettings | null {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as GeneralHrSettings) ?? null;
  const arr = normalizeList<GeneralHrSettings>(data as never).results;
  if (arr.length) return arr[0];
  return data as GeneralHrSettings;
}

export default function EssSettingsPage() {
  const { data, isLoading, error, refetch } = useGeneralHrSettings();
  const save = useSaveGeneralHrSettings();

  const settings = pickSettings(data);

  // Seed the editable form from the loaded record once (render-time guard avoids
  // an effect/setState cascade). Re-seeds if the underlying record id changes.
  const [state, setState] = useState<{ id: number | undefined; form: GeneralHrSettings }>({
    id: undefined,
    form: {},
  });
  if (settings && state.id !== settings.id) {
    setState({ id: settings.id, form: settings });
  }
  const form = state.form;

  const set = (k: keyof GeneralHrSettings, v: unknown) =>
    setState((s) => ({ ...s, form: { ...s.form, [k]: v } }));

  const onSave = () => {
    save.mutate({ id: settings?.id, data: form });
  };

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (error) return <div className="p-6"><ErrorState error={error} onRetry={refetch} /></div>;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Self-Service Settings"
        subtitle="Control what employees can do in self-service"
      />
      <Card className="max-w-2xl">
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            These general HR settings drive deductions, reliefs and employee self-service behaviour.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {(
              [
                ["paye_enabled", "Enable PAYE"],
                ["nssf_enabled", "Enable NSSF"],
                ["shif_enabled", "Enable SHIF"],
                ["housing_levy_enabled", "Enable Housing Levy"],
                ["nita_enabled", "Enable NITA"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <Switch
                  checked={!!form[key]}
                  onChange={(v) => set(key, v)}
                  id={key}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Personal Relief" htmlFor="personal_relief">
              <Input
                id="personal_relief"
                type="number"
                step="0.01"
                value={String(form.personal_relief ?? "")}
                onChange={(e) => set("personal_relief", e.target.value)}
              />
            </Field>
            <Field label="Housing Levy Rate (%)" htmlFor="housing_levy_rate">
              <Input
                id="housing_levy_rate"
                type="number"
                step="0.01"
                value={String(form.housing_levy_rate ?? "")}
                onChange={(e) => set("housing_levy_rate", e.target.value)}
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <PermissionGate permission={["change_defaultpayrollsettings", "change_generalhrsettings"]}>
              <Button size="sm" onClick={onSave} disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save Settings"}
              </Button>
            </PermissionGate>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
