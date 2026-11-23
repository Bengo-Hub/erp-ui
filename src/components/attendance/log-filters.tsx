"use client";

import { type ReactNode } from "react";

import { Card } from "@/components/ui/base";
import { Field, Input, Select } from "@/components/ui/form";
import { useDevices } from "@/hooks/use-attendance-devices";

export interface LogRange {
  from: string;
  to: string;
  device_id: string;
}

/** Date range and device filters shared by the punches and access log pages, in one row. */
export function LogFilters({
  value,
  onChange,
  children,
}: {
  value: LogRange;
  onChange: (next: LogRange) => void;
  children?: ReactNode;
}) {
  const { data } = useDevices({ limit: 200 });
  const devices = data?.data ?? [];
  return (
    <Card className="flex flex-wrap items-end gap-3 p-3">
      <Field label="From" htmlFor="log-from" className="w-[9.5rem]">
        <Input id="log-from" type="date" value={value.from} max={value.to} onChange={(e) => onChange({ ...value, from: e.target.value })} />
      </Field>
      <Field label="To" htmlFor="log-to" className="w-[9.5rem]">
        <Input id="log-to" type="date" value={value.to} min={value.from} onChange={(e) => onChange({ ...value, to: e.target.value })} />
      </Field>
      <Field label="Device" htmlFor="log-device" className="min-w-[10rem] flex-1 sm:max-w-xs">
        <Select id="log-device" value={value.device_id} onChange={(e) => onChange({ ...value, device_id: e.target.value })}>
          <option value="">All devices</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>
      {children}
    </Card>
  );
}
