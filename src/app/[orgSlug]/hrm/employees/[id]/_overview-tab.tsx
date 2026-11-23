"use client";

import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent, CardHeader } from "@/components/ui/base";
import { Select } from "@/components/ui/form";
import { useWorkShifts } from "@/hooks/use-attendance";
import { useSaveEmployee } from "@/hooks/use-employees";
import { type WorkShift } from "@/lib/api/attendance";
import { normalizeList } from "@/lib/api/drf";
import { type Employee } from "@/lib/api/employees";
import { formatDate, formatMoney } from "@/lib/utils";
import { relationLabel } from "@/lib/hrm";

import { DevicePinCard } from "./_device-pin-card";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value ?? "—"}</span>
    </div>
  );
}

/**
 * The employee's standard work shift: its weekly hours are the person's capacity in the projects
 * workload (erp-api GET /hrm/attendance/capacity). Shown to everyone who can see the employee; changed
 * by people who can edit employees. Empty means no standard shift (projects then uses its own setting).
 */
function WorkShiftCard({ employee }: { employee: Employee }) {
  const current = typeof employee.work_shift_id === "string" ? employee.work_shift_id : "";
  const { data } = useWorkShifts({ page_size: 200 });
  const shifts = useMemo(() => normalizeList<WorkShift>(data).results, [data]);
  const [picked, setPicked] = useState(current);
  const save = useSaveEmployee();
  const name = shifts.find((s) => String(s.id) === current)?.name;
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-bold text-foreground">Work shift</h3>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Row label="Standard shift" value={current ? (name ?? "A shift") : "Not set"} />
        <p className="text-xs text-muted-foreground">
          The shift&apos;s weekly hours, less approved leave and public holidays, are this person&apos;s capacity in
          project workload planning.
        </p>
        <PermissionGate permission="change_employee">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              aria-label="Standard work shift"
              value={picked}
              onChange={(e) => setPicked(e.target.value)}
              className="sm:max-w-xs"
            >
              <option value="">No standard shift</option>
              {shifts.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {s.name ?? String(s.id)}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              disabled={picked === current || save.isPending}
              onClick={() => save.mutate({ id: employee.id, data: { work_shift_id: picked } })}
            >
              {save.isPending ? "Saving" : "Save shift"}
            </Button>
          </div>
        </PermissionGate>
      </CardContent>
    </Card>
  );
}

/** Summary of the core employee record, with the standard work shift. */
export function OverviewTab({ employee }: { employee: Employee }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-bold text-foreground">Personal</h3>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Row label="Email" value={employee.email} />
          <Row label="Phone" value={employee.phone_number} />
          <Row label="Gender" value={employee.gender && <span className="capitalize">{employee.gender}</span>} />
          <Row label="Date of Birth" value={formatDate(employee.date_of_birth)} />
          <Row label="National ID" value={employee.national_id} />
          <Row label="KRA PIN" value={employee.kra_pin} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h3 className="text-sm font-bold text-foreground">Employment</h3>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Row label="Department" value={relationLabel(employee.department, employee.department_name)} />
          <Row label="Job Title" value={relationLabel(employee.job_title, employee.job_title_name)} />
          <Row label="Job Group" value={relationLabel(employee.job_group)} />
          <Row
            label="Employment Type"
            value={employee.employment_type && <span className="capitalize">{employee.employment_type}</span>}
          />
          <Row label="Date Joined" value={formatDate(employee.date_joined)} />
          <Row label="Basic Salary" value={formatMoney(employee.basic_salary)} />
        </CardContent>
      </Card>
      {/* Keyed by the saved shift so the picker resets after a save without an effect. */}
      <WorkShiftCard key={typeof employee.work_shift_id === "string" ? employee.work_shift_id : "none"} employee={employee} />
      <DevicePinCard key={`pin-${String(employee.id)}`} employee={employee} />
    </div>
  );
}
