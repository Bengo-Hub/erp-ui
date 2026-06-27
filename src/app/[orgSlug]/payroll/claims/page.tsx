"use client";

import { Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/tooltip";
import { useApproveClaim, useClaims, useDeleteClaim } from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { type Claim } from "@/lib/api/payroll";
import { formatDate, formatMoney } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  reimbursement: "Reimbursement",
  per_diem: "Per Diem",
  mileage: "Mileage",
  other: "Other",
};

export default function ClaimsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  const { data, isLoading, error, refetch } = useClaims();
  const del = useDeleteClaim();
  const approve = useApproveClaim();
  const [toDelete, setToDelete] = useState<Claim | null>(null);
  const rows = normalizeList<Claim>(data).results;

  const columns: Column<Claim>[] = [
    {
      header: "Employee",
      cell: (c) => <span className="font-medium">{c.employee_name || c.employee || "—"}</span>,
    },
    { header: "Type", cell: (c) => TYPE_LABEL[c.claim_type ?? ""] ?? c.claim_type ?? "—" },
    {
      header: "Amount",
      className: "text-right",
      headerClassName: "text-right",
      cell: (c) => formatMoney(c.amount),
    },
    { header: "Date", cell: (c) => formatDate(c.date || c.created_at) },
    {
      header: "Taxable",
      cell: (c) =>
        c.taxable ? (
          <Badge variant="warning">Taxable</Badge>
        ) : (
          <Badge variant="outline">Non-taxable</Badge>
        ),
    },
    {
      header: "Status",
      cell: (c) => {
        const v = (c.status || "pending").toLowerCase();
        return (
          <Badge variant={v.includes("approv") || v === "paid" ? "success" : v.includes("reject") || v.includes("disapprov") ? "error" : "warning"}>
            {c.status || "Pending"}
          </Badge>
        );
      },
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {!c.approved && (
            <Button
              size="sm"
              variant="ghost"
              disabled={approve.isPending}
              onClick={() => approve.mutate(c.id)}
              title="Approve — posts the reimbursement to finance"
            >
              Approve
            </Button>
          )}
          <PermissionGate permission="delete_expenseclaims">
            <IconButton label="Delete claim" onClick={() => setToDelete(c)}>
              <Trash2 className="size-4 text-destructive" />
            </IconButton>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Expense Claims"
        subtitle="Itemised reimbursement, per-diem & mileage claims"
        actions={
          <PermissionGate permission="add_expenseclaims">
            <Button size="sm" onClick={() => router.push(`/${orgSlug}/payroll/claims/new`)}>
              <Plus className="mr-1.5 size-4" /> Submit Claim
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No expense claims yet"
          emptyDescription="No expense claims have been submitted."
          onRowClick={(c) => router.push(`/${orgSlug}/payroll/claims/${c.id}`)}
        />
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete claim?"
        description="This action cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
