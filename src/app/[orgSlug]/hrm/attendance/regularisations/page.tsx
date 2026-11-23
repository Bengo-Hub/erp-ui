"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { clockTime, RegularisationDialog } from "@/components/attendance/regularisation-dialog";
import { RequestStatusFilter } from "@/components/attendance/request-status-filter";
import { ApprovalActions } from "@/components/hrm/approval-actions";
import { StatusBadge } from "@/components/hrm/status-badge";
import { Button, Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useDecideAttendanceRequest, useRegularisations } from "@/hooks/use-attendance-requests";
import { type Regularisation } from "@/lib/api/attendance-requests";
import { formatDate } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/hrm";

const span = (a?: string | null, b?: string | null) =>
  a || b ? `${clockTime(a) || "?"} to ${clockTime(b) || "?"}` : "No record";

/**
 * Attendance corrections. Staff ask for the right times on a day; the approver sees what is on
 * record next to what was asked for. An approved correction updates the record and keeps the old
 * times in its history.
 */
export default function RegularisationsPage() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, error, refetch } = useRegularisations({ status: status || undefined, page, limit: PAGE_SIZE });
  const decide = useDecideAttendanceRequest("regularisation");
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: Column<Regularisation>[] = [
    { header: "Employee", cell: (r) => <span className="font-medium">{r.employee_name ?? "—"}</span> },
    { header: "Date", cell: (r) => formatDate(r.date) },
    { header: "On record", cell: (r) => <span className="tabular-nums text-muted-foreground">{span(r.before?.check_in, r.before?.check_out)}</span> },
    { header: "Requested", cell: (r) => <span className="tabular-nums font-medium">{span(r.check_in, r.check_out)}</span> },
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
        title="Attendance corrections"
        subtitle="Missed or wrong punches, fixed with an approval"
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 size-4" /> Request a correction
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
          ariaLabel="Correction requests"
          emptyTitle={status === "pending" ? "Nothing waiting for a decision" : "No correction requests"}
          emptyDescription="Requests appear here when staff or HR ask to fix a day's times."
        />
        {total > PAGE_SIZE && (
          <div className="border-t border-border p-3">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>
      {creating && <RegularisationDialog seed={{}} onClose={() => setCreating(false)} />}
    </div>
  );
}
