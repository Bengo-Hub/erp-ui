"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { apiClient } from "@/lib/api/client";
import { ShoppingBag } from "lucide-react";

import { buildStaffPurchaseColumns, type StaffPurchaseRow } from "./_staff-purchases-columns";

export default function StaffPurchasesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["staff-sync-status"],
    queryFn: () => apiClient.get<{ data: StaffPurchaseRow[] }>("/hrm/staff-sync/status"),
    staleTime: 30_000,
  });
  const rows = data?.data ?? [];
  const columns = buildStaffPurchaseColumns();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Staff Purchases (Fund from Salary)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            POS goods taken on credit/layaway by staff, recovered via payroll deductions.
          </p>
        </div>
      </div>

      <DataTable<StaffPurchaseRow>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.employee_id}
        loading={isLoading}
        error={isError}
        emptyState={
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ShoppingBag className="h-8 w-8 opacity-30" />
            <p>No staff purchases yet.</p>
          </div>
        }
      />
    </div>
  );
}
