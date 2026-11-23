"use client";

import { type ReactNode, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent, CardHeader } from "@/components/ui/base";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { DetailSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { useAttendanceSettings, useSaveAttendanceSettings } from "@/hooks/use-attendance-requests";
import { type AttendanceSettings } from "@/lib/api/attendance-requests";
import { type GeoMode } from "@/lib/api/attendance-self";

type NumKey = {
  [K in keyof AttendanceSettings]: AttendanceSettings[K] extends number ? K : never;
}[keyof AttendanceSettings];

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function Toggle({ label, help, checked, onChange, id }: { label: string; help?: string; checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2.5 sm:col-span-2">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {help && <p className="text-xs text-muted-foreground">{help}</p>}
      </div>
      <Switch id={id} checked={checked} onChange={onChange} />
    </div>
  );
}

/** Company-wide attendance rules: clock-in policy, devices, automatic absence and overtime. */
export default function AttendanceSettingsPage() {
  const { data, isLoading, error, refetch } = useAttendanceSettings();
  const save = useSaveAttendanceSettings();
  const [draft, setDraft] = useState<AttendanceSettings | null>(null);
  const form = draft ?? data ?? null;

  if (isLoading) return <div className="p-4 sm:p-6"><DetailSkeleton /></div>;
  if (error) return <div className="p-4 sm:p-6"><ErrorState error={error} onRetry={refetch} /></div>;
  if (!form) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <PageHeader title="Attendance settings" />
        <EmptyState title="Attendance settings are not available yet" description="They appear once the attendance service on this server is updated." />
      </div>
    );
  }

  const set = <K extends keyof AttendanceSettings>(k: K, v: AttendanceSettings[K]) => setDraft({ ...form, [k]: v });
  const num = (k: NumKey, label: string, help?: string, step = "1") => (
    <Field label={label} htmlFor={k} help={help}>
      <Input
        id={k}
        type="number"
        min={0}
        step={step}
        value={String(form[k] ?? "")}
        onChange={(e) => set(k, Number(e.target.value))}
      />
    </Field>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Attendance settings"
        subtitle="Apply to every branch. Shift-level rules still set grace periods per shift."
        actions={
          <PermissionGate permission="hrm.attendance.manage">
            <Button size="sm" disabled={!draft || save.isPending} onClick={() => draft && save.mutate(draft, { onSuccess: () => setDraft(null) })}>
              {save.isPending ? "Saving" : "Save settings"}
            </Button>
          </PermissionGate>
        }
      />

      <Section title="Phone clock-in" description="How self-service clock-in treats location and photos.">
        <Field label="Outside a work site" htmlFor="geo_mode" help="Flag keeps the punch and sends it for approval.">
          <Select id="geo_mode" value={form.geo_mode} onChange={(e) => set("geo_mode", e.target.value as GeoMode)}>
            <option value="off">Allow, no location check</option>
            <option value="flag">Allow and flag for approval</option>
            <option value="block">Refuse the clock-in</option>
          </Select>
        </Field>
        {num("geo_tolerance_m", "Extra distance allowed (metres)", "Covers GPS drift at the fence edge.")}
        <Toggle id="require_photo" label="Ask for a photo at clock-in" checked={form.require_photo} onChange={(v) => set("require_photo", v)} />
      </Section>

      <Section title="Devices" description="Biometric terminals and how punches pair into records.">
        {num("device_online_minutes", "Offline after (minutes)", "A device that has not checked in for this long shows as offline.")}
        {num("punch_pair_window_minutes", "Ignore repeat punches within (minutes)", "Two punches this close count as one.")}
      </Section>

      <Section title="Absence" description="Marking people absent when they never clock in.">
        <Toggle
          id="auto_absent_enabled"
          label="Mark absent automatically"
          help="Skips people on leave, off days and public holidays."
          checked={form.auto_absent_enabled}
          onChange={(v) => set("auto_absent_enabled", v)}
        />
        <Field label="Run at" htmlFor="auto_absent_time" help="Company time, after the last shift has started.">
          <Input id="auto_absent_time" type="time" value={form.auto_absent_time} onChange={(e) => set("auto_absent_time", e.target.value)} />
        </Field>
        {num("early_leave_grace_minutes", "Early leave grace (minutes)", "Leaving earlier than this before shift end counts as early.")}
      </Section>

      <Section title="Hours and overtime" description="Used when attendance turns into overtime pay and deductions.">
        {num("min_work_hours", "Minimum hours for a full day", undefined, "0.25")}
        {num("ot_threshold_hours", "Overtime after (hours a day)", undefined, "0.25")}
        {num("ot_max_hours", "Most overtime paid a day (hours)", undefined, "0.25")}
        {num("ot_multiplier", "Overtime rate (times hourly pay)", "For example 1.5.", "0.05")}
        {num("holiday_multiplier", "Public holiday rate (times hourly pay)", "For example 2.", "0.05")}
      </Section>
    </div>
  );
}
