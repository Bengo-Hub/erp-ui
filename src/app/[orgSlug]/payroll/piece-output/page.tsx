"use client";

import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/ui/page-header";

import { EntryGrid } from "./_entry-grid";
import { ReviewTable } from "./_review-table";

/** Piece work: record each day's output with QC rejects, then approve it for payroll. */
export default function PieceOutputPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Piece output" subtitle="Units made per person, less QC rejects, paid at the piece rate" />
      <PermissionGate permission="hrm.payroll.manage">
        <EntryGrid />
      </PermissionGate>
      <ReviewTable />
    </div>
  );
}
