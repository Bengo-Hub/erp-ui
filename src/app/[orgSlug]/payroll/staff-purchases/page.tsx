"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Loader2, ShoppingBag } from "lucide-react";

interface StaffPurchaseRow {
  employee_id: string;
  employee_number: string;
  open_count: number;
  principal: string;
  recovered: string;
  outstanding: string;
}

const money = (v: string) => `KES ${Number(v || 0).toLocaleString()}`;

export default function StaffPurchasesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["staff-sync-status"],
    queryFn: () => apiClient.get<{ data: StaffPurchaseRow[] }>("/hrm/staff-sync/status"),
    staleTime: 30_000,
  });
  const rows = data?.data ?? [];

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

      {isLoading ? (
        <div className="flex items-center gap-3 h-40 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Failed to load staff purchases. Please retry.
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
          <ShoppingBag className="h-8 w-8 opacity-30" />
          <p>No staff purchases yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/30 text-left">
                <th className="px-4 py-3 font-semibold text-muted-foreground">Employee #</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Open</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Principal</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Recovered</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.employee_id} className="hover:bg-accent/20">
                  <td className="px-4 py-3 font-mono text-xs">{r.employee_number || r.employee_id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-center">{r.open_count}</td>
                  <td className="px-4 py-3 text-right">{money(r.principal)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{money(r.recovered)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{money(r.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
