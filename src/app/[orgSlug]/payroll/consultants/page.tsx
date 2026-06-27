"use client";

import { PdfPreview, useDocumentPreview } from "@bengo-hub/shared-ui-lib/documents";
import { BadgeCheck, FileText, Mail, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { useProjectOptions } from "@/hooks/use-option-hooks";
import {
  useApproveConsultantVoucher,
  useConsultantVouchers,
  useCreateConsultantVoucher,
  useDeleteConsultantVoucher,
  useEmailConsultantVouchers,
} from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { payrollApi, type ConsultantVoucher } from "@/lib/api/payroll";
import { formatMoney } from "@/lib/utils";

const TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
];

const emptyForm = {
  employee_id: "",
  title: "",
  period: "",
  gross_amount: "",
  deductions_amount: "",
  is_resident: true,
  project_id: "",
};

export default function ConsultantsPage() {
  const [tab, setTab] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const employees = useEmployeeOptions();
  const projects = useProjectOptions();
  const { openPreview, previewProps } = useDocumentPreview();

  const { data } = useConsultantVouchers(tab ? { status: tab } : undefined);
  const create = useCreateConsultantVoucher();
  const approve = useApproveConsultantVoucher();
  const del = useDeleteConsultantVoucher();
  const emailMut = useEmailConsultantVouchers();

  const rows = normalizeList<ConsultantVoucher>(data).results;
  const pageTotal = (data as { page_total?: string })?.page_total;
  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  const grossNum = parseFloat(form.gross_amount) || 0;
  const whtRate = form.is_resident ? 0.05 : 0.2;
  const whtPreview = grossNum * whtRate;
  const netPreview = grossNum - whtPreview - (parseFloat(form.deductions_amount) || 0);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const previewVoucher = (v: ConsultantVoucher) =>
    openPreview(() => payrollApi.consultantVoucherPdf(v.id).then((r) => r.blob), {
      fileName: `${v.doc_number || v.id}.pdf`,
      title: `Voucher — ${v.name || v.employee_name || ""}`,
    });

  const submit = () =>
    create.mutate(
      {
        employee_id: form.employee_id,
        title: form.title,
        period: form.period,
        gross_amount: form.gross_amount,
        deductions_amount: form.deductions_amount,
        is_resident: form.is_resident,
        project_id: form.project_id || undefined,
      } as Partial<ConsultantVoucher>,
      { onSuccess: () => { setDialogOpen(false); setForm({ ...emptyForm }); } },
    );

  const statusBadge = (s?: string) => {
    const v = (s || "draft").toLowerCase();
    return (
      <Badge variant={v === "paid" ? "success" : v === "approved" ? "success" : v === "pending" ? "default" : "secondary"}>
        {s || "Draft"}
      </Badge>
    );
  };

  const sortedRows = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Consultants"
        subtitle="Consultancy fee payment vouchers — withholding tax applied, paid via finance (not PAYE)."
        actions={
          <div className="flex items-center gap-3">
            {pageTotal != null && (
              <span className="rounded-md bg-muted px-3 py-1.5 text-sm">
                Page Total: <span className="font-semibold">{formatMoney(pageTotal)}</span>
              </span>
            )}
            <PermissionGate permission={["hrm.payroll.manage"]}>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.length === 0 || emailMut.isPending}
                onClick={() => emailMut.mutate({ ids: selectedIds })}
              >
                <Mail className="mr-1.5 size-4" /> Email Vouchers ({selectedIds.length})
              </Button>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-1.5 size-4" /> Create Payment Voucher
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <Card>
        <div className="border-b border-border px-4 pt-3">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-10 p-3" />
              <th className="p-3 text-left font-medium">Doc No.</th>
              <th className="p-3 text-left font-medium">Name</th>
              <th className="p-3 text-left font-medium">Title</th>
              <th className="p-3 text-right font-medium">WHT</th>
              <th className="p-3 text-right font-medium">Net Amount</th>
              <th className="p-3 text-center font-medium">Email</th>
              <th className="p-3 text-center font-medium">Status</th>
              <th className="p-3 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((v) => {
              const id = String(v.id);
              return (
                <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={!!selected[id]}
                      onChange={() => setSelected((s) => ({ ...s, [id]: !s[id] }))}
                      aria-label="Select voucher"
                    />
                  </td>
                  <td className="p-3 text-muted-foreground">{v.doc_number || "—"}</td>
                  <td className="p-3 font-medium">{v.name || v.employee_name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{v.title || "—"}</td>
                  <td className="p-3 text-right text-muted-foreground">{formatMoney(v.wht_amount)}</td>
                  <td className="p-3 text-right font-semibold">{formatMoney(v.net_amount)}</td>
                  <td className="p-3 text-center text-xs text-muted-foreground">{v.email_status || "Draft"}</td>
                  <td className="p-3 text-center">{statusBadge(v.status)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => previewVoucher(v)} title="Voucher PDF">
                        <FileText className="size-4" />
                      </Button>
                      {v.status !== "approved" && v.status !== "paid" && (
                        <PermissionGate permission={["hrm.payroll.manage"]}>
                          <Button size="sm" variant="ghost" disabled={approve.isPending} onClick={() => approve.mutate(v.id)} title="Approve + pay">
                            <BadgeCheck className="size-4 text-green-600" />
                          </Button>
                        </PermissionGate>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(v.id)} title="Delete">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-sm text-muted-foreground">
                  No consultant vouchers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Create Payment Voucher"
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={create.isPending}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={create.isPending || !form.employee_id || grossNum <= 0}>
              {create.isPending ? "Saving…" : `Save (Net ${formatMoney(netPreview)})`}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Consultant" required className="sm:col-span-2">
            <Combobox value={form.employee_id} onChange={(v) => set("employee_id", v)} options={employees.options} loading={employees.isLoading} placeholder="Select consultant" />
          </Field>
          <Field label="Title / Description" className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Consultant Payment for Dec 2024" />
          </Field>
          <Field label="Period">
            <Input type="month" value={form.period} onChange={(e) => set("period", e.target.value)} />
          </Field>
          <Field label="Project (optional)">
            <Combobox value={form.project_id} onChange={(v) => set("project_id", v)} options={projects.options} placeholder="Select project" />
          </Field>
          <Field label="Gross Fee" required>
            <Input type="number" step="0.01" value={form.gross_amount} onChange={(e) => set("gross_amount", e.target.value)} />
          </Field>
          <Field label="Other Deductions">
            <Input type="number" step="0.01" value={form.deductions_amount} onChange={(e) => set("deductions_amount", e.target.value)} />
          </Field>
          <Field label="Resident (5% WHT)" className="sm:col-span-2" help="Off = non-resident (20% WHT).">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_resident} onChange={(c) => set("is_resident", c)} />
              <span className="text-sm text-muted-foreground">
                WHT {formatMoney(whtPreview)} ({(whtRate * 100).toFixed(0)}%) · Net {formatMoney(netPreview)}
              </span>
            </div>
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        title="Delete voucher?"
        description="This removes the consultant payment voucher."
        confirmLabel="Delete"
        loading={del.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId == null) return;
          del.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
      />

      <PdfPreview {...previewProps} />
    </div>
  );
}
