"use client";

import { useState } from "react";

import { Button } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { useAppPermissions } from "@/hooks/use-app-permissions";
import { useCreateRegularisation } from "@/hooks/use-attendance-requests";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { isoDay } from "@/lib/date-range";
import { formatTime } from "@/lib/format";

export interface CorrectionSeed {
  employee_id?: string;
  employee_name?: string;
  date?: string;
  check_in?: string | null;
  check_out?: string | null;
}

/** "08:05" from either a full timestamp or a clock time. */
export function clockTime(v?: string | null): string {
  if (!v) return "";
  return v.includes("T") ? formatTime(v) : v.slice(0, 5);
}

/**
 * Ask for an attendance correction: the right clock-in and clock-out times for a day and why.
 * HR can raise it for anyone; everyone else raises it for themselves. Times are company time.
 */
export function RegularisationDialog({ seed, onClose }: { seed: CorrectionSeed; onClose: () => void }) {
  const { hasPermission } = useAppPermissions();
  const forOthers = hasPermission("hrm.attendance.manage");
  const employees = useEmployeeOptions();
  const create = useCreateRegularisation();
  const [employeeId, setEmployeeId] = useState(seed.employee_id ?? "");
  const [date, setDate] = useState(seed.date ?? isoDay());
  const [checkIn, setCheckIn] = useState(clockTime(seed.check_in));
  const [checkOut, setCheckOut] = useState(clockTime(seed.check_out));
  const [reason, setReason] = useState("");
  const valid = !!date && (!!checkIn || !!checkOut) && reason.trim().length >= 5 && (!forOthers || !!employeeId);

  const submit = () =>
    valid &&
    create.mutate(
      {
        employee_id: forOthers ? employeeId : undefined,
        date,
        check_in: checkIn || undefined,
        check_out: checkOut || undefined,
        reason: reason.trim(),
      },
      { onSuccess: onClose },
    );

  return (
    <Dialog
      open
      onClose={onClose}
      title="Request a correction"
      description="The approver sees the times now on record next to the times you enter."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!valid || create.isPending}>
            {create.isPending ? "Sending" : "Send for approval"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {forOthers && (
          <Field label="Employee" htmlFor="reg-employee" required className="sm:col-span-2">
            {seed.employee_id ? (
              <p className="text-sm text-foreground">{seed.employee_name ?? "Selected employee"}</p>
            ) : (
              <Combobox
                id="reg-employee"
                value={employeeId}
                onChange={setEmployeeId}
                options={employees.options}
                loading={employees.isLoading}
                placeholder="Select an employee"
              />
            )}
          </Field>
        )}
        <Field label="Date" htmlFor="reg-date" required>
          <Input id="reg-date" type="date" value={date} max={isoDay()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div />
        <Field label="Clock-in" htmlFor="reg-in" help={seed.check_in ? `On record: ${clockTime(seed.check_in)}` : undefined}>
          <Input id="reg-in" type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </Field>
        <Field label="Clock-out" htmlFor="reg-out" help={seed.check_out ? `On record: ${clockTime(seed.check_out)}` : undefined}>
          <Input id="reg-out" type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </Field>
        <Field label="Reason" htmlFor="reg-reason" required help="At least five characters." className="sm:col-span-2">
          <Input
            id="reg-reason"
            value={reason}
            maxLength={500}
            placeholder="For example: device was offline at the gate"
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}
