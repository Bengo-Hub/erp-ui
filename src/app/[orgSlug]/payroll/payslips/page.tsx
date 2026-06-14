"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { OutletFilter } from "@/components/outlet/outlet-filter";
import { Badge, Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { usePayslips } from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { type PayrollRun } from "@/lib/api/payroll";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate, formatMoney } from "@/lib/utils";

export default function PayslipsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  const queryParams = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      search: debounced || undefined,
      payment_period: period || undefined,
    }),
    [page, debounced, period],
  );

  const { data, isLoading, error, refetch } = usePayslips(queryParams);
  const { results, count } = normalizeList<PayrollRun>(data);

  const statusBadge = (s?: string) => {
    const v = (s || "").toLowerCase();
    if (v.includes("disburs") || v.includes("paid")) return <Badge variant="success">{s}</Badge>;
    if (v.includes("process") || v.includes("approv")) return <Badge variant="default">{s}</Badge>;
    return <Badge variant="secondary">{s || "Draft"}</Badge>;
  };

  const columns: Column<PayrollRun>[] = [
    {
      header: "Period",
      cell: (r) => (
        <span className="font-medium">
          {r.payment_period || r.period || `${formatDate(r.from_date)} – ${formatDate(r.to_date)}`}
        </span>
      ),
    },
    { header: "Type", cell: (r) => <span className="capitalize">{r.employment_type || "—"}</span> },
    { header: "Employees", cell: (r) => r.employee_count ?? "—" },
    {
      header: "Gross",
      className: "text-right",
      headerClassName: "text-right",
      cell: (r) => formatMoney(r.total_gross_pay),
    },
    {
      header: "Net Pay",
      className: "text-right font-semibold",
      headerClassName: "text-right",
      cell: (r) => formatMoney(r.total_net_pay),
    },
    { header: "Status", cell: (r) => statusBadge(r.status) },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Payslips"
        subtitle="Processed payroll runs and individual payslips"
        actions={<OutletFilter tenantSlug={orgSlug} />}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search employee or period…"
            className="min-w-[220px] flex-1"
          />
          <Input
            type="month"
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setPage(1);
            }}
            className="w-auto"
          />
        </div>

        <DataTable
          columns={columns}
          rows={results}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No payslips yet"
          emptyDescription="Process a payroll run to generate payslips."
          onRowClick={(r) => router.push(`/${orgSlug}/payroll/payslips/${r.id}`)}
        />
        {results.length > 0 && (
          <div className="border-t border-border">
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
