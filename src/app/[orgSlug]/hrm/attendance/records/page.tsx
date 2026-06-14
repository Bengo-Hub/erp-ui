"use client";

import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/hrm/status-badge";
import { OutletFilter } from "@/components/outlet/outlet-filter";
import { Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { useAttendanceRecords } from "@/hooks/use-attendance";
import { useDebounce } from "@/hooks/use-debounce";
import { normalizeList } from "@/lib/api/drf";
import { type AttendanceRecord } from "@/lib/api/attendance";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";
import { useParams } from "next/navigation";

function timePart(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  return v;
}

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
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Attendance Records" subtitle="Daily check-in / check-out logs" />
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
    </div>
  );
}
