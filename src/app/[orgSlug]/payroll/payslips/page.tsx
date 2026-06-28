"use client";

import { PdfPreview, useDocumentPreview } from "@bengo-hub/shared-ui-lib/documents";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BadgeCheck, Banknote, ChevronDown, ChevronRight, FileDown, ListChecks, Mail, Printer, RefreshCw } from "lucide-react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { OutletFilter } from "@/components/outlet/outlet-filter";
import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { IconButton } from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/use-debounce";
import { useApprovePayroll, useDisbursePayroll, usePayslips } from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { payrollApi, type Payslip } from "@/lib/api/payroll";
import { formatMoney } from "@/lib/utils";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "disbursed", label: "Disbursed" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function statusKey(s?: string): string {
  const v = (s || "").toLowerCase();
  if (v.includes("disburs") || v.includes("paid") || v.includes("publish")) return "disbursed";
  if (v.includes("approv")) return "approved";
  if (v.includes("pending") || v.includes("process")) return "pending";
  return "draft";
}

function periodKey(p: Payslip): string {
  return (
    p.payment_period ||
    p.period ||
    p.pay_period ||
    (typeof p.from_date === "string" ? p.from_date.slice(0, 7) : "") ||
    "—"
  );
}

function formatPeriod(p: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(p);
  if (!m) return p || "—";
  return `${MONTHS[Number(m[2]) - 1] ?? p} ${m[1]}`;
}

type PeriodGroup = {
  period: string;
  label: string;
  payslips: Payslip[];
  count: number;
  totalBasic: number;
  totalGross: number;
  totalNet: number;
  publishedCount: number;
  status: string;
};

function groupStatus(payslips: Payslip[]): string {
  const keys = payslips.map((p) => statusKey(p.status ?? (p.payment_status as string)));
  if (keys.length && keys.every((k) => k === "disbursed")) return "disbursed";
  if (keys.length && keys.every((k) => k === "approved" || k === "disbursed")) return "approved";
  if (keys.some((k) => k === "pending" || k === "approved")) return "pending";
  return "draft";
}

function StatusBadge({ status }: { status: string }) {
  const k = statusKey(status);
  if (k === "disbursed") return <Badge variant="success">Disbursed</Badge>;
  if (k === "approved") return <Badge variant="success">Approved</Badge>;
  if (k === "pending") return <Badge variant="default">Pending</Badge>;
  return <Badge variant="secondary">Draft</Badge>;
}

export default function PayslipsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("");
  const [tab, setTab] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const debounced = useDebounce(search);

  const [menuOpen, setMenuOpen] = useState(false);
  const approve = useApprovePayroll();
  const disburse = useDisbursePayroll();
  // Server-rendered payslip PDF preview (Print / Download / Open-in-tab) — never browser print.
  const { openPreview, previewProps } = useDocumentPreview();
  function printPayslip(ps: Payslip) {
    openPreview(() => payrollApi.payslipPdf(ps.id).then((r) => r.blob), {
      fileName: `payslip_${ps.id}.pdf`,
      title: ps.employee_name ? `Payslip — ${ps.employee_name}` : "Payslip",
    });
  }
  const [confirm, setConfirm] = useState<{ kind: "approve" | "disburse"; period: string; label: string } | null>(null);

  // Pull the full set so we can group by month client-side (the API returns individual payslips).
  const queryParams = useMemo(
    () => ({ page: 1, page_size: 500, payment_period: period || undefined }),
    [period],
  );
  const { data, isLoading, error, refetch } = usePayslips(queryParams);
  const { results } = normalizeList<Payslip>(data);

  const groups = useMemo<PeriodGroup[]>(() => {
    const q = debounced.trim().toLowerCase();
    const map = new Map<string, Payslip[]>();
    for (const ps of results) {
      if (q) {
        const hay = `${ps.employee_name ?? ""} ${ps.employee_number ?? ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const key = periodKey(ps);
      const bucket = map.get(key);
      if (bucket) bucket.push(ps);
      else map.set(key, [ps]);
    }
    const arr: PeriodGroup[] = [...map.entries()].map(([p, payslips]) => ({
      period: p,
      label: formatPeriod(p),
      payslips,
      count: payslips.length,
      totalBasic: payslips.reduce((a, x) => a + num(x.basic_salary ?? x.gross_pay), 0),
      totalGross: payslips.reduce((a, x) => a + num(x.gross_pay ?? x.total_earnings), 0),
      totalNet: payslips.reduce((a, x) => a + num(x.net_pay), 0),
      publishedCount: payslips.filter((x) => x.published === true || statusKey(x.status) === "disbursed").length,
      status: groupStatus(payslips),
    }));
    arr.sort((a, b) => b.period.localeCompare(a.period));
    return tab === "all" ? arr : arr.filter((g) => g.status === tab);
  }, [results, debounced, tab]);

  const toggle = (p: string) => setExpanded((e) => ({ ...e, [p]: !e[p] }));

  const exportCsv = () => {
    const header = ["Month", "No. of Payslips", "Basic Pay", "Net Pay", "Approval", "Publish"];
    const lines = groups.map((g) =>
      [g.label, g.count, g.totalBasic.toFixed(2), g.totalNet.toFixed(2), g.status, `${g.publishedCount}/${g.count}`]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payslips.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Payslips"
        subtitle="Processed payroll runs grouped by month — expand a period to review, approve and disburse"
        actions={
          <div className="flex items-center gap-2">
            <OutletFilter tenantSlug={orgSlug} />
            {/* Process Payroll ▾ — wingubox-style split action menu. */}
            <div className="relative">
              <Button size="sm" onClick={() => setMenuOpen((o) => !o)}>
                <Banknote className="mr-1.5 size-4" /> Process Payroll <ChevronDown className="ml-1 size-3.5" />
              </Button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-border bg-popover py-1 shadow-md">
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => { setMenuOpen(false); router.push(`/${orgSlug}/payroll/process`); }}
                    >
                      <Banknote className="size-4" /> Process Payroll
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => { setMenuOpen(false); router.push(`/${orgSlug}/payroll/email-payslips`); }}
                    >
                      <Mail className="size-4" /> Email Pay Slips
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => { setMenuOpen(false); router.push(`/${orgSlug}/reports/muster-roll`); }}
                    >
                      <Printer className="size-4" /> Print Payslips
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employee…"
            className="min-w-[220px] flex-1"
          />
          <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-auto" />
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="mr-1.5 size-4" /> Refresh Data
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={groups.length === 0}>
            <FileDown className="mr-1.5 size-4" /> CSV
          </Button>
        </div>

        <div className="border-b border-border px-4 pt-3">
          <Tabs tabs={STATUS_TABS} active={tab} onChange={setTab} />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : groups.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No payslips" description="Process a payroll run to generate payslips." />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Column header */}
            <div className="hidden items-center gap-3 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:flex">
              <span className="w-6" />
              <span className="flex-1">Payroll month</span>
              <span className="w-20 text-center">Payslips</span>
              <span className="w-32 text-right">Basic Pay</span>
              <span className="w-32 text-right">Net pay</span>
              <span className="w-28 text-center">Approval</span>
              <span className="w-24 text-center">Publish (ESS)</span>
              <span className="w-28 text-right">Actions</span>
            </div>

            {groups.map((g) => {
              const open = !!expanded[g.period];
              const k = statusKey(g.status);
              return (
                <div key={g.period}>
                  {/* Period row */}
                  <div
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/40"
                    onClick={() => toggle(g.period)}
                  >
                    <span className="text-muted-foreground">
                      {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </span>
                    <span className="flex-1 font-semibold text-foreground">{g.label}</span>
                    <span className="w-20 text-center text-sm">{g.count}</span>
                    <span className="w-32 text-right text-sm text-muted-foreground">{formatMoney(g.totalBasic)}</span>
                    <span className="w-32 text-right text-sm font-semibold">{formatMoney(g.totalNet)}</span>
                    <span className="w-28 text-center"><StatusBadge status={g.status} /></span>
                    <span className="w-24 text-center">
                      {g.publishedCount > 0 ? (
                        <Badge variant="success">{g.publishedCount === g.count ? "Published" : `${g.publishedCount}/${g.count}`}</Badge>
                      ) : (
                        <Badge variant="secondary">Not published</Badge>
                      )}
                    </span>
                    <div className="flex w-28 items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <IconButton label="View muster roll" onClick={() => router.push(`/${orgSlug}/reports/muster-roll?period=${g.period}`)}>
                        <ListChecks className="size-4" />
                      </IconButton>
                      {k !== "approved" && k !== "disbursed" && (
                        <PermissionGate permission={["hrm.payroll.manage"]}>
                          <IconButton label="Approve period" onClick={() => setConfirm({ kind: "approve", period: g.period, label: g.label })}>
                            <BadgeCheck className="size-4 text-green-600" />
                          </IconButton>
                        </PermissionGate>
                      )}
                      {k === "approved" && (
                        <PermissionGate permission={["hrm.payroll.disburse"]}>
                          <IconButton label="Disburse period" onClick={() => setConfirm({ kind: "disburse", period: g.period, label: g.label })}>
                            <Banknote className="size-4 text-primary" />
                          </IconButton>
                        </PermissionGate>
                      )}
                    </div>
                  </div>

                  {/* Expanded employee payslips */}
                  {open && (
                    <div className="bg-muted/20 px-4 pb-3 pt-1">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="py-1.5 text-left font-medium">Employee</th>
                            <th className="py-1.5 text-right font-medium">Gross</th>
                            <th className="py-1.5 text-right font-medium">Net pay</th>
                            <th className="py-1.5 text-center font-medium">Status</th>
                            <th className="py-1.5 text-right font-medium" />
                          </tr>
                        </thead>
                        <tbody>
                          {g.payslips.map((ps) => (
                            <tr
                              key={ps.id}
                              className="cursor-pointer border-t border-border/60 hover:bg-background"
                              onClick={() => router.push(`/${orgSlug}/payroll/payslips/${ps.id}`)}
                            >
                              <td className="py-2">
                                <span className="font-medium text-foreground">{ps.employee_name || "Employee"}</span>
                                {ps.employee_number ? (
                                  <span className="ml-2 text-xs text-muted-foreground">{ps.employee_number}</span>
                                ) : null}
                              </td>
                              <td className="py-2 text-right text-muted-foreground">{formatMoney(ps.gross_pay ?? ps.total_earnings)}</td>
                              <td className="py-2 text-right font-medium">{formatMoney(ps.net_pay)}</td>
                              <td className="py-2 text-center"><StatusBadge status={ps.status ?? (ps.payment_status as string)} /></td>
                              <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
                                <IconButton label="Print payslip" onClick={() => printPayslip(ps)}>
                                  <Printer className="size-4" />
                                </IconButton>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.kind === "disburse" ? "Disburse this period?" : "Approve this period?"}
        description={
          confirm?.kind === "disburse"
            ? `Disburse net pay for ${confirm?.label}. This posts to the GL and triggers payout — a significant action.`
            : `Approve all payslips for ${confirm?.label} so they can be disbursed.`
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

      <PdfPreview {...previewProps} />
    </div>
  );
}
