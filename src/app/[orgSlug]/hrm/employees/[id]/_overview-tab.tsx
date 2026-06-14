"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/base";
import { type Employee } from "@/lib/api/employees";
import { formatDate, formatMoney } from "@/lib/utils";
import { relationLabel } from "@/lib/hrm";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value ?? "—"}</span>
    </div>
  );
}

/** Read-only summary of the core employee record. */
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
    </div>
  );
}
