"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";

interface ApprovalActionsProps {
  /** Whether the record is in a state that can be approved/rejected. */
  pending: boolean;
  /** Permission(s) required to approve/reject. */
  permission?: string | string[];
  onApprove: () => void;
  onReject: (reason: string) => void;
  approving?: boolean;
  rejecting?: boolean;
  /** Compact icon buttons (table rows) vs labelled buttons (detail pages). */
  size?: "sm" | "default";
  approveLabel?: string;
}

/**
 * Reusable approve / reject control used across leave, timesheet, appraisal and
 * performance-review workflows. Approve is confirmed; reject collects a reason.
 * Both are gated behind PermissionGate.
 */
export function ApprovalActions({
  pending,
  permission,
  onApprove,
  onReject,
  approving,
  rejecting,
  size = "default",
  approveLabel = "Approve",
}: ApprovalActionsProps) {
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!pending) return null;
  const icon = size === "sm";

  return (
    <PermissionGate permission={permission}>
      <div className="flex items-center gap-1.5">
        {icon ? (
          <>
            <Button variant="ghost" size="icon" aria-label="Approve" onClick={() => setConfirmApprove(true)}>
              <Check className="size-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Reject" onClick={() => setRejectOpen(true)}>
              <X className="size-4 text-destructive" />
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => setConfirmApprove(true)} disabled={approving}>
              <Check className="mr-1.5 size-4" /> {approveLabel}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRejectOpen(true)} disabled={rejecting}>
              <X className="mr-1.5 size-4" /> Reject
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmApprove}
        title={`${approveLabel}?`}
        description="This action will move the record forward in its workflow."
        confirmLabel={approveLabel}
        loading={approving}
        onCancel={() => setConfirmApprove(false)}
        onConfirm={() => {
          onApprove();
          setConfirmApprove(false);
        }}
      />

      <Dialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)} disabled={rejecting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onReject(reason);
                setRejectOpen(false);
                setReason("");
              }}
              disabled={rejecting}
            >
              {rejecting ? "Rejecting…" : "Reject"}
            </Button>
          </>
        }
      >
        <Field label="Reason" htmlFor="reject-reason" help="Shared with the requester.">
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this is being rejected…"
          />
        </Field>
      </Dialog>
    </PermissionGate>
  );
}
