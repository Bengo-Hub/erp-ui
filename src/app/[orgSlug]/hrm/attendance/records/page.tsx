"use client";

import { LogIn, LogOut } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { StatusBadge } from "@/components/hrm/status-badge";
import { OutletFilter } from "@/components/outlet/outlet-filter";
import { Button, Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { useCheckIn, useCheckOut, useAttendanceRecords } from "@/hooks/use-attendance";
import { useDebounce } from "@/hooks/use-debounce";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { normalizeList } from "@/lib/api/drf";
import { type AttendanceRecord } from "@/lib/api/attendance";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate, formatTime } from "@/lib/utils";
import { useParams } from "next/navigation";

const MANAGE = "hrm.attendance.manage";

const timePart = (v?: string) => formatTime(v);

export default function AttendanceRecordsPage() {
  const orgSlug = (useParams()?.orgSlug as string) ?? "";
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  const params = useMemo(
    () => ({ page, page_size: PAGE_SIZE, search: debounced || undefined, date: date || undefined }),
    [page, debounced, date],
  );
  const { data, isLoading, error, refetch } = useAttendanceRecords(params);
  const { results, count } = normalizeList<AttendanceRecord>(data);

  const { options: employees } = useEmployeeOptions();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");

  const columns: Column<AttendanceRecord>[] = [
    {
      header: "Employee",
      cell: (r) => <span className="font-medium">{r.employee_name || r.employee || "—"}</span>,
    },
    { header: "Date", cell: (r) => formatDate(r.date) },
    { header: "Check In", cell: (r) => timePart(r.check_in) },
    { header: "Check Out", cell: (r) => timePart(r.check_out) },
    { header: "Hours", cell: (r) => r.hours_worked ?? "—" },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) =>
        r.check_in && !r.check_out ? (
          <PermissionGate permission={MANAGE}>
            <Button variant="ghost" size="sm" disabled={checkOut.isPending} onClick={() => checkOut.mutate(r.id)}>
              <LogOut className="mr-1.5 size-4" /> Check Out
            </Button>
          </PermissionGate>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Attendance Records"
        subtitle="Daily check-in / check-out logs"
        actions={
          <PermissionGate permission={MANAGE}>
            <Button size="sm" onClick={() => { setEmployeeId(""); setCheckInOpen(true); }}>
              <LogIn className="mr-1.5 size-4" /> Check In
            </Button>
          </PermissionGate>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search employee…"
            className="min-w-[220px] flex-1"
          />
          <OutletFilter tenantSlug={orgSlug} />
          <Input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
            className="w-auto"
          />
        </div>
        <DataTable
          columns={columns}
          rows={results}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No attendance records"
          emptyDescription="Records appear here as employees clock in and out."
        />
        {results.length > 0 && (
          <div className="border-t border-border">
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <Dialog
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        title="Check In Employee"
        description="Records a check-in for the selected employee at the current time."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setCheckInOpen(false)} disabled={checkIn.isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!employeeId || checkIn.isPending}
              onClick={() => checkIn.mutate({ employee_id: employeeId }, { onSuccess: () => setCheckInOpen(false) })}
            >
              {checkIn.isPending ? "Checking in…" : "Check In"}
            </Button>
          </>
        }
      >
        <Field label="Employee" required>
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Select employee…</option>
            {employees.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </Dialog>
    </div>
  );
}
