"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { LogFilters, type LogRange } from "@/components/attendance/log-filters";
import { Badge, Card } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Field, Switch } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { usePunches } from "@/hooks/use-attendance-devices";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { type AttendancePunch } from "@/lib/api/attendance-devices";
import { daysAgo, isoDay } from "@/lib/date-range";
import { formatDateTime } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/hrm";

const SOURCE_LABEL: Record<AttendancePunch["source"], string> = {
  device: "Device",
  mobile: "Mobile",
  web: "Web",
  manual: "Manual",
};

/**
 * Every raw punch as received, from devices and self clock-in. "Unmatched only" shows punches the
 * ERP could not pair to an employee (usually a device PIN with no employee) or to a record.
 */
export default function PunchesPage() {
  const params = useSearchParams();
  const [range, setRange] = useState<LogRange>({ from: daysAgo(6), to: isoDay(), device_id: "" });
  const [employeeId, setEmployeeId] = useState("");
  const [unmatched, setUnmatched] = useState(params.get("unmatched") === "true");
  const [page, setPage] = useState(1);
  const employees = useEmployeeOptions();

  const { data, isLoading, error, refetch } = usePunches({
    from: range.from,
    to: range.to,
    device_id: range.device_id || undefined,
    employee_id: employeeId || undefined,
    unmatched: unmatched || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => {
    setPage(1);
    fn(v);
  };

  const columns: Column<AttendancePunch>[] = [
    { header: "Time", cell: (p) => <span className="tabular-nums">{formatDateTime(p.punched_at)}</span> },
    {
      header: "Employee",
      cell: (p) =>
        p.employee_name ? (
          <span className="font-medium">{p.employee_name}</span>
        ) : (
          <span className="text-muted-foreground">Unknown PIN {p.device_pin ?? ""}</span>
        ),
    },
    { header: "Source", cell: (p) => SOURCE_LABEL[p.source] ?? p.source },
    { header: "Device", cell: (p) => p.device_name || p.device_sn || "—" },
    { header: "Verified by", cell: (p) => <span className="capitalize">{p.verify_mode || "—"}</span> },
    {
      header: "Record",
      cell: (p) => (p.record_id ? <Badge variant="success">Matched</Badge> : <Badge variant="warning">Unmatched</Badge>),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Punches" subtitle="Raw clock events from devices and self clock-in" />
      <LogFilters value={range} onChange={resetPage(setRange)}>
        <Field label="Employee" htmlFor="punch-employee" className="min-w-[12rem] flex-1 sm:max-w-xs">
          <Combobox
            id="punch-employee"
            value={employeeId}
            onChange={resetPage(setEmployeeId)}
            options={employees.options}
            loading={employees.isLoading}
            placeholder="All employees"
          />
        </Field>
        <label className="flex min-h-10 items-center gap-2 text-sm text-foreground">
          <Switch id="punch-unmatched" checked={unmatched} onChange={resetPage(setUnmatched)} />
          Unmatched only
        </label>
      </LogFilters>
      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(p) => p.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          ariaLabel="Punches"
          emptyTitle={unmatched ? "No unmatched punches" : "No punches in this range"}
          emptyDescription={unmatched ? "Every punch in the range belongs to a known employee." : "Try a wider date range."}
        />
        {total > PAGE_SIZE && (
          <div className="border-t border-border p-3">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
