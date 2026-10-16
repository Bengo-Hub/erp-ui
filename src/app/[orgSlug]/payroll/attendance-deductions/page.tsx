"use client";

import { useMemo, useState } from "react";
import { Calculator, CheckCircle2, RotateCcw, XCircle } from "lucide-react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { SubscriptionGate } from "@/components/subscription/subscription-gate";
import { Badge, Button, Card, CardContent } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import {
  useAttendanceDeductions,
  useComputeAttendanceDeductions,
  useReviewAttendanceDeductions,
} from "@/hooks/use-payroll";
import { type AttendanceDeduction, type AttendanceDeductionStatus } from "@/lib/api/payroll";

const PAGE = 50;
const thisMonth = new Date().toISOString().slice(0, 7);
const kes = (v: string | number) => `KES ${(Number(v) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusVariant: Record<AttendanceDeductionStatus, "warning" | "success" | "secondary" | "default"> = {
  pending: "warning",
  approved: "success",
  waived: "secondary",
  applied: "default",
};
const statusLabel: Record<AttendanceDeductionStatus, string> = {
  pending: "To review",
  approved: "Approved",
  waived: "Waived",
  applied: "On payslip",
};

type Action = "approve" | "waive" | "reopen";

/**
 * Attendance deductions: a month's lateness and unexcused absence priced from attendance and the
 * attendance rules. Nothing reaches a payslip until it is approved here; the payroll run then
 * takes approved amounts off gross pay before tax.
 */
export default function AttendanceDeductionsPage() {
  const [month, setMonth] = useState(thisMonth);
  const [status, setStatus] = useState<AttendanceDeductionStatus | "">("pending");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Action | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading, error, refetch } = useAttendanceDeductions({
    month,
    status: status || undefined,
    page,
    limit: PAGE,
  });
  const compute = useComputeAttendanceDeductions();
  const review = useReviewAttendanceDeductions();
  const rows = useMemo(() => data?.data ?? [], [data]);
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE));

  // Only rows the chosen action can change are selectable together with it.
  const canAct = (r: AttendanceDeduction, a: Action) =>
    a === "reopen" ? r.status === "approved" || r.status === "waived" : r.status === "pending";
  const selectedRows = rows.filter((r) => selected.has(r.id));
  const countFor = (a: Action) => selectedRows.filter((r) => canAct(r, a)).length;

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectable = rows.filter((r) => r.status !== "applied");
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.id));

  const reset = () => {
    setSelected(new Set());
    setPage(1);
  };
  const run = (a: Action) =>
    review.mutate(
      { ids: selectedRows.filter((r) => canAct(r, a)).map((r) => r.id), action: a, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setPending(null);
          setNote("");
          setSelected(new Set());
        },
      },
    );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Attendance deductions"
        subtitle="Lateness and unexcused absence, priced from attendance and your attendance rules. Only approved deductions reach payslips."
      />
      <SubscriptionGate feature="payroll">
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3">
            <Field label="Payroll month">
              <Input
                type="month"
                value={month}
                max={thisMonth}
                onChange={(e) => {
                  if (e.target.value) {
                    setMonth(e.target.value);
                    reset();
                  }
                }}
              />
            </Field>
            <Field label="Show">
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as AttendanceDeductionStatus | "");
                  reset();
                }}
              >
                <option value="pending">To review</option>
                <option value="approved">Approved</option>
                <option value="waived">Waived</option>
                <option value="applied">On payslip</option>
                <option value="">All</option>
              </Select>
            </Field>
            <PermissionGate permission={["hrm.payroll.process"]}>
              <Button variant="outline" onClick={() => compute.mutate(month)} disabled={compute.isPending}>
                <Calculator className="mr-1.5 size-4" />
                {compute.isPending ? "Working out…" : "Work out from attendance"}
              </Button>
            </PermissionGate>
            {data && (
              <p className="pb-2 text-sm text-muted-foreground sm:ml-auto">
                {data.total} row{data.total === 1 ? "" : "s"}, {kes(data.amount_total)}
              </p>
            )}
          </CardContent>
        </Card>

        {selectedRows.length > 0 && (
          <PermissionGate permission={["hrm.payroll.process"]}>
            <Card>
              <CardContent className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedRows.length} selected</span>
                <Button size="sm" onClick={() => setPending("approve")} disabled={!countFor("approve")}>
                  <CheckCircle2 className="mr-1.5 size-4" /> Approve ({countFor("approve")})
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPending("waive")} disabled={!countFor("waive")}>
                  <XCircle className="mr-1.5 size-4" /> Waive ({countFor("waive")})
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPending("reopen")} disabled={!countFor("reopen")}>
                  <RotateCcw className="mr-1.5 size-4" /> Reopen ({countFor("reopen")})
                </Button>
              </CardContent>
            </Card>
          </PermissionGate>
        )}

        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No attendance deductions"
            description={
              status === "pending"
                ? "Nothing to review for this month. Use \"Work out from attendance\" after attendance is recorded."
                : "No deductions match this filter."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={allSelected}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(selectable.map((r) => r.id)))}
                    />
                  </th>
                  <th className="px-3 py-2">Employee</th>
                  <th className="px-3 py-2">Kind</th>
                  <th className="px-3 py-2">How it was worked out</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.employee_name}`}
                        disabled={r.status === "applied"}
                        checked={selected.has(r.id)}
                        onChange={() => toggle(r.id)}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">{r.employee_name || r.employee_id.slice(0, 8)}</td>
                    <td className="px-3 py-2">{r.kind === "absence" ? "Absence" : "Late arrival"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.basis}
                      {r.note && <p className="text-xs italic">Note: {r.note}</p>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{kes(r.amount)}</td>
                    <td className="px-3 py-2">
                      <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-muted-foreground">
              Page {page} of {pages}
            </span>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </SubscriptionGate>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending === "approve"
            ? `Approve ${countFor("approve")} deduction(s)?`
            : pending === "waive"
              ? `Waive ${countFor("waive")} deduction(s)?`
              : `Reopen ${countFor("reopen")} deduction(s) for review?`
        }
        description={
          <div className="space-y-2">
            <p>
              {pending === "approve"
                ? "Approved deductions are taken off gross pay in the next payroll run for this month."
                : pending === "waive"
                  ? "Waived deductions are never deducted. You can reopen them later."
                  : "Reopened deductions go back to review and are recalculated the next time you work them out."}
            </p>
            {pending !== "reopen" && (
              <Input placeholder="Note (optional)" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
            )}
          </div>
        }
        confirmLabel={pending === "approve" ? "Approve" : pending === "waive" ? "Waive" : "Reopen"}
        destructive={pending === "waive"}
        loading={review.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && run(pending)}
      />
    </div>
  );
}
