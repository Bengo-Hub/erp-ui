"use client";

import { CheckCircle2, ClipboardCheck, Send, Undo2, XCircle } from "lucide-react";
import { useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useDecidePayrollRun,
  useDisbursePayroll,
  usePayrollRunStatus,
  useReversePayroll,
  useSubmitPayrollApproval,
} from "@/hooks/use-payroll";
import { type RunTarget } from "@/lib/api/payroll";

type Action = "submit" | "approve" | "reject" | "disburse" | "reverse";

const CONFIRM: Record<Action, { title: string; body: string; label: string; destructive?: boolean }> = {
  submit: {
    title: "Submit payroll for approval?",
    body: "The run goes to its approvers. It cannot be disbursed until it is approved.",
    label: "Submit",
  },
  approve: {
    title: "Approve this payroll?",
    body: "Approving signs off every payslip in the run so it can be disbursed.",
    label: "Approve",
  },
  reject: {
    title: "Reject this payroll?",
    body: "The payslips go back for correction and must be submitted for approval again.",
    label: "Reject",
    destructive: true,
  },
  disburse: {
    title: "Disburse net pay?",
    body: "This posts the payroll to the ledger and sends net pay through Treasury. Disbursing again later only retries payslips that are not paid yet.",
    label: "Disburse",
    destructive: true,
  },
  reverse: {
    title: "Reverse this payroll?",
    body: "The ledger posting is reversed and the payslips go back for correction and a new approval. This is only possible while no net pay has been sent.",
    label: "Reverse",
    destructive: true,
  },
};

/**
 * The approve, disburse and reverse steps of one payroll run, driven by the run's status: each
 * action shows only when the API says it is open, behind the permission the API checks.
 */
export function PayrollRunActions({ target }: { target: RunTarget }) {
  const { data: st, isLoading } = usePayrollRunStatus(target);
  const submit = useSubmitPayrollApproval();
  const decide = useDecidePayrollRun();
  const disburse = useDisbursePayroll();
  const reverse = useReversePayroll();
  const [pending, setPending] = useState<Action | null>(null);

  if (isLoading || !st) return <p className="text-sm text-muted-foreground">Loading the run…</p>;
  if (st.payslips === 0) {
    return <p className="text-sm text-muted-foreground">No processed payslips for this period yet.</p>;
  }

  const awaitingDecision = st.approval_request_status === "pending" && st.pending > 0 && !!st.approval_request_id;
  const busy = submit.isPending || decide.isPending || disburse.isPending || reverse.isPending;

  const run = () => {
    if (!pending) return;
    const done = { onSettled: () => setPending(null) };
    switch (pending) {
      case "submit":
        submit.mutate(target, done);
        break;
      case "reject":
        if (awaitingDecision) decide.mutate({ requestId: st.approval_request_id!, approve: false }, done);
        else submit.mutate({ ...target, reject: true }, done);
        break;
      case "approve":
        decide.mutate({ requestId: st.approval_request_id!, approve: true }, done);
        break;
      case "disburse":
        disburse.mutate(target, done);
        break;
      case "reverse":
        reverse.mutate(target, done);
        break;
    }
  };

  const counts: [string, number, "secondary" | "warning" | "success" | "error"][] = [
    ["Draft", st.draft, "secondary"],
    ["Awaiting approval", st.pending, "warning"],
    ["Approved", st.approved, "success"],
    ["Rejected", st.rejected, "error"],
    ["Posted, not paid", st.posted, "warning"],
    ["Paid", st.paid, "success"],
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-center gap-2">
        {counts
          .filter(([, n]) => n > 0)
          .map(([label, n, variant]) => (
            <Badge key={label} variant={variant}>
              {label}: {n}
            </Badge>
          ))}
      </div>
      {awaitingDecision && (
        <p className="text-center text-sm text-muted-foreground">
          This run is waiting for approval. Approvers decide it here or under Approvals.
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        {st.can_submit && (
          <PermissionGate permission={["hrm.payroll.process"]}>
            <Button variant="outline" onClick={() => setPending("submit")} disabled={busy}>
              <ClipboardCheck className="mr-1.5 size-4" /> Submit for Approval
            </Button>
          </PermissionGate>
        )}
        {awaitingDecision && (
          <PermissionGate permission={["approvals.decide"]}>
            <Button onClick={() => setPending("approve")} disabled={busy}>
              <CheckCircle2 className="mr-1.5 size-4" /> Approve
            </Button>
            <Button variant="outline" onClick={() => setPending("reject")} disabled={busy}>
              <XCircle className="mr-1.5 size-4" /> Reject
            </Button>
          </PermissionGate>
        )}
        {st.can_disburse && (
          <PermissionGate permission={["hrm.payroll.disburse"]}>
            <Button onClick={() => setPending("disburse")} disabled={busy}>
              <Send className="mr-1.5 size-4" /> {st.posted > 0 ? "Retry Disbursement" : "Disburse Payroll"}
            </Button>
          </PermissionGate>
        )}
        {st.can_reverse && (
          <PermissionGate permission={["hrm.payroll.disburse"]}>
            <Button variant="outline" onClick={() => setPending("reverse")} disabled={busy}>
              <Undo2 className="mr-1.5 size-4" /> Reverse
            </Button>
          </PermissionGate>
        )}
      </div>
      {!st.can_submit && !awaitingDecision && !st.can_disburse && st.paid === st.payslips && (
        <p className="text-center text-sm text-muted-foreground">Every payslip in this run is paid.</p>
      )}

      <ConfirmDialog
        open={!!pending}
        title={pending ? CONFIRM[pending].title : ""}
        description={pending ? CONFIRM[pending].body : ""}
        confirmLabel={pending ? CONFIRM[pending].label : ""}
        destructive={pending ? CONFIRM[pending].destructive : false}
        loading={busy}
        onCancel={() => setPending(null)}
        onConfirm={run}
      />
    </div>
  );
}
