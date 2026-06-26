"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { useAccrueLeave, useLeaveBalances } from "@/hooks/use-leave";
import { normalizeList } from "@/lib/api/drf";
import { type LeaveBalance } from "@/lib/api/leave";
import { PAGE_SIZE } from "@/lib/hrm";

export default function LeaveBalancesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  const params = useMemo(
    () => ({ page, page_size: PAGE_SIZE, search: debounced || undefined }),
    [page, debounced],
  );
  const { data, isLoading, error, refetch } = useLeaveBalances(params);
  const { results, count } = normalizeList<LeaveBalance>(data);
  const accrue = useAccrueLeave();

  const num = (v: unknown) => (v == null || v === "" ? "—" : String(v));

  const columns: Column<LeaveBalance>[] = [
    {
      header: "Employee",
      cell: (b) => <span className="font-medium">{b.employee_name || b.employee || "—"}</span>,
    },
    { header: "Leave Type", cell: (b) => b.leave_category_name || b.category_name || "—" },
    { header: "Year", cell: (b) => num(b.year) },
    {
      header: "Entitled",
      className: "text-right",
      headerClassName: "text-right",
      cell: (b) => num(b.entitled ?? b.total_days),
    },
    {
      header: "Used",
      className: "text-right",
      headerClassName: "text-right",
      cell: (b) => num(b.used ?? b.used_days),
    },
    {
      header: "Remaining",
      className: "text-right font-semibold",
      headerClassName: "text-right",
      cell: (b) => num(b.remaining ?? b.balance),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Leave Balances"
        subtitle="Entitled, used and remaining leave per employee"
        actions={
          <PermissionGate permission="hrm.leave.manage">
            <Button size="sm" variant="outline" disabled={accrue.isPending} onClick={() => accrue.mutate(undefined)}>
              <RefreshCw className="mr-1.5 size-4" /> {accrue.isPending ? "Running…" : "Run Accrual"}
            </Button>
          </PermissionGate>
        }
      />
      <Card>
        <div className="border-b border-border p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search employee…"
            className="max-w-sm"
          />
        </div>
        <DataTable
          columns={columns}
          rows={results}
          rowKey={(b) => b.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No leave balances"
          emptyDescription="Balances are computed from entitlements and approved leave."
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
