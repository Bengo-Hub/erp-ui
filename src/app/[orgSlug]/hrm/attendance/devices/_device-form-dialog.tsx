"use client";

import { useState } from "react";

import { Button } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { useSaveDevice } from "@/hooks/use-attendance-devices";
import { useOutletOptions, useWorkSiteOptions } from "@/hooks/use-option-hooks";
import { type AttendanceDevice, type DeviceInput, type DeviceMode } from "@/lib/api/attendance-devices";

const toForm = (d?: AttendanceDevice | null): DeviceInput => ({
  serial: d?.serial ?? "",
  name: d?.name ?? "",
  mode: d?.mode ?? "ta",
  active: d?.active ?? true,
  outlet_id: d?.outlet_id ?? "",
  work_site_id: d?.work_site_id ?? "",
  timezone: d?.timezone ?? "",
  allowed_cidrs: d?.allowed_cidrs ?? [],
});

/** One address or CIDR per line or comma; blanks dropped. */
const parseAddresses = (s: string) =>
  s
    .split(/[\n,]/)
    .map((x) => x.trim())
    .filter(Boolean);

/**
 * Register a device by the serial number printed on its label (also under Menu > System Info on
 * the terminal), or edit an existing one. The serial cannot change after registration.
 */
export function DeviceFormDialog({
  open,
  device,
  onClose,
}: {
  open: boolean;
  device: AttendanceDevice | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<DeviceInput>(() => toForm(device));
  const [addresses, setAddresses] = useState(() => (device?.allowed_cidrs ?? []).join("\n"));
  const save = useSaveDevice();
  const outlets = useOutletOptions();
  const sites = useWorkSiteOptions();
  const set = <K extends keyof DeviceInput>(k: K, v: DeviceInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.serial.trim() && form.name.trim();

  const submit = () => {
    if (!valid) return;
    const data: DeviceInput = {
      ...form,
      serial: form.serial.trim().toUpperCase(),
      name: form.name.trim(),
      outlet_id: form.outlet_id || null,
      work_site_id: form.work_site_id || null,
      timezone: form.timezone?.trim() || null,
      allowed_cidrs: parseAddresses(addresses),
    };
    save.mutate({ id: device?.id, data }, { onSuccess: onClose });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={device ? "Edit device" : "Register device"}
      description="Point the device's cloud server setting at this ERP, then register its serial here."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!valid || save.isPending}>
            {save.isPending ? "Saving" : device ? "Save device" : "Register device"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Serial number" htmlFor="serial" required>
          <Input
            id="serial"
            value={form.serial}
            disabled={!!device}
            autoComplete="off"
            placeholder="e.g. CQUJ223260015"
            onChange={(e) => set("serial", e.target.value)}
          />
        </Field>
        <Field label="Name" htmlFor="name" required>
          <Input id="name" value={form.name} placeholder="e.g. Main gate" onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Mode" htmlFor="mode">
          <Select id="mode" value={form.mode} onChange={(e) => set("mode", e.target.value as DeviceMode)}>
            <option value="ta">Time and attendance</option>
            <option value="ac">Access control (door)</option>
          </Select>
        </Field>
        <Field label="Branch" htmlFor="outlet">
          <Combobox
            id="outlet"
            value={form.outlet_id ?? ""}
            onChange={(v) => set("outlet_id", v)}
            options={outlets.options}
            loading={outlets.isLoading}
            placeholder="Select a branch"
            clearable
          />
        </Field>
        <Field label="Work site" htmlFor="site">
          <Combobox
            id="site"
            value={form.work_site_id ?? ""}
            onChange={(v) => set("work_site_id", v)}
            options={sites.options}
            loading={sites.isLoading}
            placeholder="Optional"
            clearable
          />
        </Field>
        <Field label="Time zone" htmlFor="tz">
          <Input
            id="tz"
            value={form.timezone ?? ""}
            placeholder="Company time zone"
            onChange={(e) => set("timezone", e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Allowed internet addresses" htmlFor="cidrs">
            <textarea
              id="cidrs"
              rows={2}
              value={addresses}
              placeholder="Optional. The site's public IP or range, e.g. 41.90.12.7 or 41.90.0.0/16"
              onChange={(e) => setAddresses(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </Field>
          <p className="mt-1 text-xs text-muted-foreground">
            When set, punches claiming this serial from any other address are refused.
          </p>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Accept punches from this device</span>
          <Switch id="active" checked={form.active} onChange={(v) => set("active", v)} />
        </div>
      </div>
    </Dialog>
  );
}
