"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

import { RequestStatusFilter } from "@/components/attendance/request-status-filter";
import { PermissionGate } from "@/components/auth/permission-gate";
import { StatusBadge } from "@/components/hrm/status-badge";
import { Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Field, Input } from "@/components/ui/form";
import { useMoney } from "@/hooks/use-money";
import { usePieceOutputs, useReviewPieceOutputs } from "@/hooks/use-piece-rate";
import { type PieceOutput } from "@/lib/api/piece-rate";
import { daysAgo, isoDay } from "@/lib/date-range";
import { formatDate, formatNumber } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/hrm";

/** Output lines with bulk approve or reject. Approved lines are paid in the next payroll run. */
export function ReviewTable() {
  const { format } = useMoney();
  const [status, setStatus] = useState("pending");
  const [from, setFrom] = useState(daysAgo(13));
  const [to, setTo] = useState(isoDay());
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const { data, isLoading, error, refetch } = usePieceOutputs({ status: status || undefined, from, to, page, limit: PAGE_SIZE });
  const review = useReviewPieceOutputs();
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const pendingIds = rows.filter((r) => r.status === "pending").map((r) => r.id);
  const allPicked = pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));

  const reset = () => {
    setPage(1);
    setSelected(new Set());
  };
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const columns: Column<PieceOutput>[] = [
    {
      header: (
        <input
          type="checkbox"
          aria-label="Select all waiting lines on this page"
          className="size-4"
          checked={allPicked}
          disabled={!pendingIds.length}
          onChange={() => setSelected(allPicked ? new Set() : new Set(pendingIds))}
        />
      ),
      cell: (r) =>
        r.status === "pending" ? (
          <input type="checkbox" aria-label={`Select ${r.employee_name ?? "line"}`} className="size-4" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
        ) : null,
    },
    { header: "Employee", cell: (r) => <span className="font-medium">{r.employee_name ?? "—"}</span> },
    { header: "Date", cell: (r) => formatDate(r.date) },
    { header: "Operation", cell: (r) => r.piece_rate_name ?? "—" },
    { header: "Made", className: "text-right tabular-nums", headerClassName: "text-right", cell: (r) => formatNumber(r.quantity, 0) },
    { header: "QC rejected", className: "text-right tabular-nums", headerClassName: "text-right", cell: (r) => formatNumber(r.rejected_quantity, 0) },
    {
      header: "Paid units",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (r) => formatNumber(Math.max(0, r.quantity - r.rejected_quantity), 0),
    },
    {
      header: "Amount",
      className: "text-right tabular-nums",
      headerClassName: "text-right",
      cell: (r) => (r.amount != null ? format(r.amount, 2, r.currency) : "—"),
    },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const count = selected.size;

  return (
    <Card>
      <div className="flex flex-wrap items-end gap-3 border-b border-border p-4">
        <RequestStatusFilter
          value={status}
          onChange={(v) => {
            reset();
            setStatus(v);
          }}
        />
        <Field label="From" htmlFor="rv-from" className="w-40">
          <Input id="rv-from" type="date" value={from} max={to} onChange={(e) => { reset(); setFrom(e.target.value); }} />
        </Field>
        <Field label="To" htmlFor="rv-to" className="w-40">
          <Input id="rv-to" type="date" value={to} min={from} onChange={(e) => { reset(); setTo(e.target.value); }} />
        </Field>
        <PermissionGate permission="hrm.payroll.manage">
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" disabled={!count} onClick={() => setAction("reject")}>
              <X className="mr-1.5 size-4" /> Reject {count || ""}
            </Button>
            <Button size="sm" disabled={!count} onClick={() => setAction("approve")}>
              <Check className="mr-1.5 size-4" /> Approve {count || ""}
            </Button>
          </div>
        </PermissionGate>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        ariaLabel="Piece output"
        emptyTitle={status === "pending" ? "Nothing waiting for review" : "No output in this range"}
        emptyDescription="Lines appear here once output is recorded."
      />
      {total > PAGE_SIZE && (
        <div className="border-t border-border p-3">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={(p) => { setSelected(new Set()); setPage(p); }} />
        </div>
      )}
      <ConfirmDialog
        open={!!action}
        title={action === "approve" ? `Approve ${count} ${count === 1 ? "line" : "lines"}?` : `Reject ${count} ${count === 1 ? "line" : "lines"}?`}
        description={action === "approve" ? "Approved output is paid in the next payroll run." : "Rejected output is not paid."}
        confirmLabel={action === "approve" ? "Approve" : "Reject"}
        destructive={action === "reject"}
        loading={review.isPending}
        onCancel={() => setAction(null)}
        onConfirm={() =>
          action &&
          review.mutate(
            { ids: [...selected], action },
            {
              onSettled: () => setAction(null),
              onSuccess: () => setSelected(new Set()),
            },
          )
        }
      />
    </Card>
  );
}
