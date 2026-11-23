"use client";

import { useState } from "react";

import { Button } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { useAppPermissions } from "@/hooks/use-app-permissions";
import { useCreateOvertimeRequest } from "@/hooks/use-attendance-requests";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { isoDay } from "@/lib/date-range";

/** Ask for overtime ahead of the day (or just after it). HR can ask on someone's behalf. */
export function OvertimeDialog({ onClose }: { onClose: () => void }) {
  const { hasPermission } = useAppPermissions();
  const forOthers = hasPermission("hrm.attendance.manage");
  const employees = useEmployeeOptions();
  const create = useCreateOvertimeRequest();
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(isoDay());
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const h = Number(hours);
  const valid = !!date && h > 0 && h <= 24 && reason.trim().length >= 5 && (!forOthers || !!employeeId);

  return (
    <Dialog
      open
      onClose={onClose}
      title="Request overtime"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!valid || create.isPending}
            onClick={() =>
              create.mutate(
                { employee_id: forOthers ? employeeId : undefined, date, hours: h, reason: reason.trim() },
                { onSuccess: onClose },
              )
            }
          >
            {create.isPending ? "Sending" : "Send for approval"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {forOthers && (
          <Field label="Employee" htmlFor="ot-employee" required className="sm:col-span-2">
            <Combobox
              id="ot-employee"
              value={employeeId}
              onChange={setEmployeeId}
              options={employees.options}
              loading={employees.isLoading}
              placeholder="Select an employee"
            />
          </Field>
        )}
        <Field label="Date" htmlFor="ot-date" required>
          <Input id="ot-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Hours" htmlFor="ot-hours" required>
          <Input id="ot-hours" type="number" min={0.25} max={24} step={0.25} inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
        </Field>
        <Field label="Reason" htmlFor="ot-reason" required help="At least five characters." className="sm:col-span-2">
          <Input
            id="ot-reason"
            value={reason}
            maxLength={500}
            placeholder="For example: month-end stock count"
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}
