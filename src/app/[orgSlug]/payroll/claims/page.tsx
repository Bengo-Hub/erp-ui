"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge, Button } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useApproveClaim, useClaims, useDeleteClaim, useSaveClaim } from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { type Claim } from "@/lib/api/payroll";
import { formatDate, formatMoney } from "@/lib/utils";

const fields: CrudFieldDef[] = [
  { name: "employee", label: "Employee ID", type: "number", required: true },
  {
    name: "claim_type",
    label: "Claim Type",
    type: "select",
    options: [
      { value: "reimbursement", label: "Reimbursement (non-taxable)" },
      { value: "per_diem", label: "Per Diem" },
      { value: "mileage", label: "Mileage" },
      { value: "other", label: "Other" },
    ],
  },
  { name: "amount", label: "Amount", type: "number", step: "0.01", required: true },
  { name: "date", label: "Date", type: "date" },
  // Analytic tagging: cost posts against this project/cost-center in treasury.
  { name: "project_id", label: "Project ID (optional)" },
  { name: "cost_center_id", label: "Cost Center ID (optional)" },
  // Taxable excess (per-diem/mileage over KRA caps, taxable allowances) flows to the payslip;
  // non-taxable reimbursements are paid via treasury AP and never inflate PAYE.
  { name: "taxable", label: "Taxable (flows to payslip / PAYE)", type: "switch" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function ClaimsPage() {
  const { data, isLoading, error, refetch } = useClaims();
  const save = useSaveClaim();
  const del = useDeleteClaim();
  const approve = useApproveClaim();
  const rows = normalizeList<Claim>(data).results;

  const columns: Column<Claim>[] = [
    {
      header: "Employee",
      cell: (c) => <span className="font-medium">{c.employee_name || c.employee || "—"}</span>,
    },
    { header: "Type", cell: (c) => c.claim_type || "—" },
    {
      header: "Amount",
      className: "text-right",
      headerClassName: "text-right",
      cell: (c) => formatMoney(c.amount),
    },
    { header: "Date", cell: (c) => formatDate(c.date || c.created_at) },
    { header: "Taxable", cell: (c) => (c.taxable ? <Badge variant="warning">Taxable</Badge> : <Badge variant="outline">Non-taxable</Badge>) },
    {
      header: "Status",
      cell: (c) => {
        const v = (c.status || "pending").toLowerCase();
        return (
          <Badge variant={v.includes("approv") ? "success" : v.includes("reject") ? "error" : "warning"}>
            {c.status || "Pending"}
          </Badge>
        );
      },
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (c) =>
        c.approved ? null : (
          <Button
            size="sm"
            variant="ghost"
            disabled={approve.isPending}
            onClick={() => approve.mutate(c.id)}
            title="Approve — posts the reimbursement to finance"
          >
            Approve
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Expense Claims" subtitle="Employee reimbursement claims" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Claim"
        emptyDescription="No expense claims have been submitted."
        toForm={(c) => ({
          employee: c?.employee ?? "",
          claim_type: c?.claim_type ?? "reimbursement",
          amount: c?.amount ?? "",
          date: c?.date ?? "",
          project_id: c?.project_id ?? "",
          cost_center_id: c?.cost_center_id ?? "",
          taxable: c?.taxable ?? false,
          description: c?.description ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate(
            {
              id,
              data: {
                ...data,
                employee: data.employee ? Number(data.employee) : undefined,
                taxable: Boolean(data.taxable),
              } as Partial<Claim>,
            },
            { onSuccess: done },
          )
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
      />
    </div>
  );
}
