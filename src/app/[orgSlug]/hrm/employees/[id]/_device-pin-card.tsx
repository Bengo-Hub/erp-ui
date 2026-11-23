"use client";

import { useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent, CardHeader } from "@/components/ui/base";
import { Field, Input } from "@/components/ui/form";
import { useSetDevicePin } from "@/hooks/use-attendance-devices";
import { type Employee } from "@/lib/api/employees";

/** The PIN stored on the employee, read from metadata (where erp-api keeps it) or a flat field. */
function currentPin(e: Employee): string {
  const meta = (e.metadata ?? {}) as Record<string, unknown>;
  const v = meta.device_pin ?? (e as Record<string, unknown>).device_pin;
  return v == null ? "" : String(v);
}

/**
 * The employee's user number on the biometric devices. Each punch carries this PIN, so it must be
 * unique in the company. After a change, "Sync users" on the devices loads it.
 */
export function DevicePinCard({ employee }: { employee: Employee }) {
  const saved = currentPin(employee);
  const [pin, setPin] = useState(saved);
  const save = useSetDevicePin();
  const valid = /^\d{1,9}$/.test(pin);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-bold text-foreground">Biometric device</h3>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm text-foreground">{saved ? `Device PIN ${saved}` : "No device PIN yet"}</p>
        <PermissionGate permission="hrm.attendance.manage">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field
              label="Device PIN"
              htmlFor="device-pin"
              help="Digits only, unique in the company. Enrol the face or finger on the device under this number."
              className="sm:max-w-xs"
            >
              <Input
                id="device-pin"
                inputMode="numeric"
                value={pin}
                maxLength={9}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Button
              size="sm"
              className="sm:mb-6"
              disabled={!valid || pin === saved || save.isPending}
              onClick={() => save.mutate({ employeeId: employee.id, pin })}
            >
              {save.isPending ? "Saving" : "Save PIN"}
            </Button>
          </div>
        </PermissionGate>
      </CardContent>
    </Card>
  );
}
