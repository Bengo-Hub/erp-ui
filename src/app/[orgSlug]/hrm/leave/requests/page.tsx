"use client";

import { Plus } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { ApprovalActions } from "@/components/hrm/approval-actions";
import { StatusBadge } from "@/components/hrm/status-badge";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Tabs } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useApproveLeave,
  useLeaveRequests,
  useRejectLeave,
} from "@/hooks/use-leave";
import { normalizeList } from "@/lib/api/drf";
import { type LeaveRequest } from "@/lib/api/leave";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";

export default function LeaveRequestsPage() {
  const router = useRouter();
  const orgSlug = (useParams()?.orgSlug as string) ?? "";

  const [tab, setTab] = useState<"all" | "approvals">("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  const params = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      search: debounced || undefined,
      status: tab === "approvals" ? "pending" : status || undefined,
    }),
    [page, debounced, status, tab],
  );

  const { data, isLoading, error, refetch } = useLeaveRequests(params);
  const approve = useApproveLeave();
  const reject = useRejectLeave();
  const { results, count } = normalizeList<LeaveRequest>(data);

  const columns: Column<LeaveRequest>[] = [
    {
      header: "Employee",
      cell: (r) => <span className="font-medium">{r.employee_name || r.employee || "—"}</span>,
    },
    { header: "Type", cell: (r) => r.leave_category_name || r.category_name || "—" },
    { header: "From", cell: (r) => formatDate(r.start_date) },
    { header: "To", cell: (r) => formatDate(r.end_date) },
    { header: "Days", cell: (r) => r.number_of_days ?? r.days ?? "—" },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) => (
        <ApprovalActions
          size="sm"
          pending={(r.status || "").toLowerCase() === "pending"}
          permission={["change_leaverequest", "approve_leaverequest"]}
          onApprove={() => approve.mutate(r.id)}
          onReject={(reason) => reject.mutate({ id: r.id, reason })}
          approving={approve.isPending}
          rejecting={reject.isPending}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Leave Requests"
        subtitle="Apply for leave and manage approvals"
        actions={
          <PermissionGate permission="add_leaverequest">
            <Button size="sm" onClick={() => router.push(`/${orgSlug}/hrm/leave/requests/new`)}>
              <Plus className="mr-1.5 size-4" /> Apply for Leave
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <div className="border-b border-border px-4 pt-2">
          <Tabs
            tabs={[
              { key: "all", label: "All Requests" },
              { key: "approvals", label: "Approvals Queue" },
            ]}
            active={tab}
            onChange={(k) => {
              setTab(k as "all" | "approvals");
              setPage(1);
            }}
          />
        </div>
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
          {tab === "all" && (
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-auto min-w-[150px]"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          )}
        </div>

        <DataTable
          columns={columns}
          rows={results}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle={tab === "approvals" ? "Nothing to approve" : "No leave requests"}
          emptyDescription={
            tab === "approvals"
              ? "There are no pending leave requests."
              : "Leave requests will appear here once submitted."
          }
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
