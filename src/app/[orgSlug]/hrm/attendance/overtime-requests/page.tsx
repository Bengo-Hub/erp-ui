"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { RequestStatusFilter } from "@/components/attendance/request-status-filter";
import { ApprovalActions } from "@/components/hrm/approval-actions";
import { StatusBadge } from "@/components/hrm/status-badge";
import { Button, Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useDecideAttendanceRequest, useOvertimeRequests } from "@/hooks/use-attendance-requests";
import { type OvertimeRequest } from "@/lib/api/attendance-requests";
import { formatDate, formatNumber } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/hrm";

import { OvertimeDialog } from "./_overtime-dialog";

/**
 * Overtime asked for in advance. When the company requires approval, only approved hours are paid
 * as overtime in payroll; the rest of the time worked stays ordinary hours.
 */
export default function OvertimeRequestsPage() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, error, refetch } = useOvertimeRequests({ status: status || undefined, page, limit: PAGE_SIZE });
  const decide = useDecideAttendanceRequest("overtime");
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: Column<OvertimeRequest>[] = [
    { header: "Employee", cell: (r) => <span className="font-medium">{r.employee_name ?? "—"}</span> },
    { header: "Date", cell: (r) => formatDate(r.date) },
    { header: "Hours", className: "text-right tabular-nums", headerClassName: "text-right", cell: (r) => formatNumber(r.hours, 2) },
    { header: "Reason", cell: (r) => <span className="line-clamp-2 max-w-xs text-sm">{r.reason}</span> },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: "",
      className: "text-right",
      cell: (r) =>
        r.approval_request_id ? (
          <ApprovalActions
            pending={r.status === "pending"}
            permission="approvals.decide"
            approving={decide.isPending}
            rejecting={decide.isPending}
            onApprove={() => decide.mutate({ requestId: r.approval_request_id as string, approve: true })}
            onReject={(reason) => decide.mutate({ requestId: r.approval_request_id as string, approve: false, comment: reason })}
            size="sm"
          />
        ) : null,
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Overtime requests"
        subtitle="Overtime agreed before it is worked"
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 size-4" /> Request overtime
          </Button>
        }
      />
      <RequestStatusFilter
        value={status}
        onChange={(v) => {
          setPage(1);
          setStatus(v);
        }}
      />
      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          ariaLabel="Overtime requests"
          emptyTitle={status === "pending" ? "Nothing waiting for a decision" : "No overtime requests"}
          emptyDescription="Requests appear here when staff or HR ask for overtime."
        />
        {total > PAGE_SIZE && (
          <div className="border-t border-border p-3">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>
      {creating && <OvertimeDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
