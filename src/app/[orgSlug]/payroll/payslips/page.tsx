"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BadgeCheck, Banknote, ListChecks } from "lucide-react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { OutletFilter } from "@/components/outlet/outlet-filter";
import { Badge, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Tabs } from "@/components/ui/tabs";
import { IconButton } from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/use-debounce";
import { useApprovePayroll, useDisbursePayroll, usePayslips } from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { type PayrollRun } from "@/lib/api/payroll";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate, formatMoney } from "@/lib/utils";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "disbursed", label: "Disbursed" },
];

function statusKey(s?: string): string {
  const v = (s || "").toLowerCase();
  if (v.includes("disburs") || v.includes("paid") || v.includes("publish")) return "disbursed";
  if (v.includes("approv")) return "approved";
  if (v.includes("pending") || v.includes("process")) return "pending";
  return "draft";
}

export default function PayslipsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  const approve = useApprovePayroll();
  const disburse = useDisbursePayroll();
  const [confirm, setConfirm] = useState<{ kind: "approve" | "disburse"; period: string } | null>(null);

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
  const rows = useMemo(
    () => (tab === "all" ? results : results.filter((r) => statusKey(r.status) === tab)),
    [results, tab],
  );

  const statusBadge = (s?: string) => {
    const k = statusKey(s);
    if (k === "disbursed") return <Badge variant="success">{s || "Disbursed"}</Badge>;
    if (k === "approved") return <Badge variant="success">{s || "Approved"}</Badge>;
    if (k === "pending") return <Badge variant="default">{s || "Pending"}</Badge>;
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
    { header: "Payslips", cell: (r) => r.employee_count ?? "—" },
    { header: "Gross", className: "text-right", headerClassName: "text-right", cell: (r) => formatMoney(r.total_gross_pay) },
    { header: "Net Pay", className: "text-right font-semibold", headerClassName: "text-right", cell: (r) => formatMoney(r.total_net_pay) },
    { header: "Status", cell: (r) => statusBadge(r.status) },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) => {
        const k = statusKey(r.status);
        const p = r.payment_period || r.period || "";
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <IconButton label="View Muster Roll" onClick={() => router.push(`/${orgSlug}/reports/muster-roll`)}>
              <ListChecks className="size-4" />
            </IconButton>
            {k !== "approved" && k !== "disbursed" && (
              <PermissionGate permission={["hrm.payroll.manage"]}>
                <IconButton label="Approve period" onClick={() => p && setConfirm({ kind: "approve", period: p })}>
                  <BadgeCheck className="size-4 text-green-600" />
                </IconButton>
              </PermissionGate>
            )}
            {k === "approved" && (
              <PermissionGate permission={["hrm.payroll.disburse"]}>
                <IconButton label="Disburse period" onClick={() => p && setConfirm({ kind: "disburse", period: p })}>
                  <Banknote className="size-4 text-primary" />
                </IconButton>
              </PermissionGate>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Payslips"
        subtitle="Processed payroll runs grouped by period — review, approve and disburse"
        actions={<OutletFilter tenantSlug={orgSlug} />}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search employee or period…"
            className="min-w-[220px] flex-1"
          />
          <Input type="month" value={period} onChange={(e) => { setPeriod(e.target.value); setPage(1); }} className="w-auto" />
        </div>

        <div className="border-b border-border px-4 pt-3">
          <Tabs tabs={STATUS_TABS} active={tab} onChange={setTab} />
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No payslips"
          emptyDescription="Process a payroll run to generate payslips."
          onRowClick={(r) => router.push(`/${orgSlug}/payroll/payslips/${r.id}`)}
        />
        {rows.length > 0 && (
          <div className="border-t border-border">
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.kind === "disburse" ? "Disburse this period?" : "Approve this period?"}
        description={
          confirm?.kind === "disburse"
            ? `Disburse net pay for ${confirm?.period}. This posts to the GL and triggers payout — a significant action.`
            : `Approve all payslips for ${confirm?.period} so they can be disbursed.`
        }
        confirmLabel={confirm?.kind === "disburse" ? "Disburse" : "Approve"}
        loading={approve.isPending || disburse.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          const opts = { onSuccess: () => setConfirm(null) };
          if (confirm.kind === "disburse") disburse.mutate({ payment_period: confirm.period }, opts);
          else approve.mutate({ approve: true, payment_period: confirm.period }, opts);
        }}
      />
    </div>
  );
}
