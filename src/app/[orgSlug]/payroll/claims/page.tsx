"use client";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useClaims, useDeleteClaim, useSaveClaim } from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { type Claim } from "@/lib/api/payroll";
import { formatDate, formatMoney } from "@/lib/utils";

const fields: CrudFieldDef[] = [
  { name: "employee", label: "Employee ID", type: "number", required: true },
  { name: "claim_type", label: "Claim Type" },
  { name: "amount", label: "Amount", type: "number", step: "0.01", required: true },
  { name: "date", label: "Date", type: "date" },
  { name: "description", label: "Description", type: "textarea", span2: true },
];

export default function ClaimsPage() {
  const { data, isLoading, error, refetch } = useClaims();
  const save = useSaveClaim();
  const del = useDeleteClaim();
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
          claim_type: c?.claim_type ?? "",
          amount: c?.amount ?? "",
          date: c?.date ?? "",
          description: c?.description ?? "",
        })}
        onSave={({ id, data }, done) =>
          save.mutate(
            {
              id,
              data: {
                ...data,
                employee: data.employee ? Number(data.employee) : undefined,
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
