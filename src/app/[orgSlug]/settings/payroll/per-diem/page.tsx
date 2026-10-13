"use client";

import { useEffect, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent, CardHeader } from "@/components/ui/base";
import { Input, Switch } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useJobGroups } from "@/hooks/use-hrm-settings";
import { usePerDiemPolicy, useSavePerDiemPolicy } from "@/hooks/use-payroll-settings";
import { normalizeList } from "@/lib/api/drf";
import { type JobGroup } from "@/lib/api/hrm-settings";
import { type PerDiemPolicy } from "@/lib/api/payroll-settings";

import { usePayrollSettingsTabs } from "../_tabs";

// Per diem for staff who travel for work. Logistics raises a claim when a staff rider finishes a
// trip; the amount is days x the employee's job group rate (or the default rate). Claims go
// through the normal approval, KRA per diem caps, payroll and reimbursement.

type Form = {
  enabled: boolean;
  daily_rate: string;
  min_distance_km: string;
  max_days: string;
  auto_approve: boolean;
  rates: Record<string, string>;
};

const toForm = (p?: PerDiemPolicy): Form => ({
  enabled: !!p?.enabled,
  daily_rate: p?.daily_rate && Number(p.daily_rate) > 0 ? String(Number(p.daily_rate)) : "",
  min_distance_km: String(p?.min_distance_km ?? 50),
  max_days: p?.max_days ? String(p.max_days) : "",
  auto_approve: !!p?.auto_approve,
  rates: Object.fromEntries(Object.entries(p?.job_group_rates ?? {}).map(([k, v]) => [k, String(Number(v))])),
});

export default function PerDiemSettingsPage() {
  const { tabs, active, onChange } = usePayrollSettingsTabs("per-diem");
  const { data, isLoading } = usePerDiemPolicy();
  const save = useSavePerDiemPolicy();
  const groups = normalizeList<JobGroup>(useJobGroups().data).results;
  const [form, setForm] = useState<Form>(toForm());

  useEffect(() => {
    if (data) setForm(toForm(data));
  }, [data]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const hasRate = Number(form.daily_rate) > 0 || Object.values(form.rates).some((v) => Number(v) > 0);
  const invalid = form.enabled && !hasRate;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    const job_group_rates: Record<string, string> = {};
    for (const [id, v] of Object.entries(form.rates)) {
      if (Number(v) > 0) job_group_rates[id] = String(Number(v));
    }
    save.mutate({
      enabled: form.enabled,
      daily_rate: String(Number(form.daily_rate) || 0),
      job_group_rates,
      min_distance_km: Math.max(0, Number(form.min_distance_km) || 0),
      max_days: Math.max(0, Math.floor(Number(form.max_days) || 0)),
      auto_approve: form.auto_approve,
    });
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Payroll Settings" subtitle="Per diem for staff trips (claimed from logistics and other services)" />
      <Tabs tabs={tabs} active={active} onChange={onChange} />

      {isLoading ? (
        <LoadingState />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-foreground">Per diem</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                When a staff rider finishes a trip in logistics, a per diem claim is raised here for days x rate. Claims follow
                the usual approval, KRA per diem caps, payroll and reimbursement.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-foreground">Pay per diem</span>
                  <p className="text-xs text-muted-foreground">
                    {form.enabled ? "Trips raise per diem claims." : "Off: no per diem claims are raised."}
                  </p>
                </div>
                <Switch checked={form.enabled} onChange={(v) => set("enabled", v)} id="per-diem-enabled" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm font-medium">
                  Default daily rate (KES)
                  <Input
                    className="mt-1"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.daily_rate}
                    onChange={(e) => set("daily_rate", e.target.value)}
                    placeholder="e.g. 1500"
                  />
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">Used when the job group has no rate.</span>
                </label>
                <label className="block text-sm font-medium">
                  Minimum trip distance (km)
                  <Input className="mt-1" type="number" min={0} value={form.min_distance_km} onChange={(e) => set("min_distance_km", e.target.value)} />
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">Shorter trips earn no per diem.</span>
                </label>
                <label className="block text-sm font-medium">
                  Most days per claim
                  <Input
                    className="mt-1"
                    type="number"
                    min={0}
                    value={form.max_days}
                    onChange={(e) => set("max_days", e.target.value)}
                    placeholder="No limit"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-foreground">Approve automatically</span>
                  <p className="text-xs text-muted-foreground">
                    {form.auto_approve ? "Claims from trips are approved as they arrive." : "HR approves each claim (recommended)."}
                  </p>
                </div>
                <Switch checked={form.auto_approve} onChange={(v) => set("auto_approve", v)} id="per-diem-auto-approve" />
              </div>
              {invalid && <p className="text-sm text-destructive">Set a default daily rate or a job group rate before turning per diem on.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-foreground">Rates by job group</h3>
              <p className="mt-1 text-xs text-muted-foreground">Optional. Leave a group empty to use the default rate.</p>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No job groups yet. Add them under HR settings to set per group rates.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {groups.map((g) => {
                    const id = String(g.id);
                    return (
                      <label key={id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                        <span className="min-w-0 truncate font-medium">
                          {g.name}
                          {g.grade ? <span className="ml-1 text-xs font-normal text-muted-foreground">({g.grade})</span> : null}
                        </span>
                        <Input
                          className="w-32"
                          type="number"
                          min={0}
                          step="0.01"
                          value={form.rates[id] ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, rates: { ...f.rates, [id]: e.target.value } }))}
                          placeholder="Default"
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <PermissionGate
            permission={["change_defaultpayrollsettings", "add_defaultpayrollsettings"]}
            fallback={<p className="text-sm text-muted-foreground">You don&apos;t have permission to change payroll settings.</p>}
          >
            <div className="flex justify-end">
              <Button type="submit" disabled={save.isPending || invalid}>
                {save.isPending ? "Saving..." : "Save per diem policy"}
              </Button>
            </div>
          </PermissionGate>
        </form>
      )}
    </div>
  );
}
