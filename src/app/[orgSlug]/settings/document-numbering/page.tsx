"use client";

import { Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/tooltip";
import { useDocumentSequences, useSaveDocumentSequence } from "@/hooks/use-settings";
import { normalizeList } from "@/lib/api/drf";
import {
  DOC_TYPES,
  RESET_FREQUENCIES,
  type DocumentSequence,
} from "@/lib/api/settings";

const EMPTY: DocumentSequence = {
  doc_type: "",
  prefix: "",
  separator: "-",
  date_format: "YYYY",
  padding: 6,
  reset_freq: "yearly",
};

function docTypeLabel(t: string) {
  return DOC_TYPES.find((d) => d.value === t)?.label ?? t;
}

/** Render a sample document number from a sequence config (next value = current + 1). */
function preview(s: DocumentSequence): string {
  const sep = s.separator ?? "-";
  const dateToken = (s.date_format || "")
    .replace("YYYY", "2026")
    .replace("YYMMDD", "260626")
    .replace("YYYYMMDD", "20260626")
    .replace("MMYY", "0626")
    .replace("YY", "26");
  const seq = String((Number(s.current_val) || 0) + 1).padStart(Number(s.padding) || 0, "0");
  return [s.prefix, dateToken, seq].filter(Boolean).join(sep);
}

export default function DocumentNumberingPage() {
  const { data, isLoading, error, refetch } = useDocumentSequences();
  const save = useSaveDocumentSequence();
  const rows = normalizeList<DocumentSequence>(data).results;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentSequence | null>(null);
  const [form, setForm] = useState<DocumentSequence>(EMPTY);
  const set = (k: keyof DocumentSequence, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const usedTypes = useMemo(() => new Set(rows.map((r) => r.doc_type)), [rows]);
  const availableTypes = DOC_TYPES.filter((d) => !usedTypes.has(d.value));

  const openDialog = (s?: DocumentSequence) => {
    setEditing(s ?? null);
    setForm(s ? { ...EMPTY, ...s } : { ...EMPTY, doc_type: availableTypes[0]?.value ?? "" });
    setOpen(true);
  };

  const submit = () => {
    if (!form.doc_type) return;
    save.mutate(
      {
        doc_type: form.doc_type,
        prefix: form.prefix,
        separator: form.separator,
        date_format: form.date_format,
        padding: Number(form.padding) || 0,
        reset_freq: form.reset_freq,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  const columns: Column<DocumentSequence>[] = [
    { header: "Document", cell: (s) => <span className="font-medium">{docTypeLabel(s.doc_type)}</span> },
    {
      header: "Sample",
      cell: (s) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{preview(s) || "—"}</code>,
    },
    { header: "Reset", cell: (s) => RESET_FREQUENCIES.find((r) => r.value === s.reset_freq)?.label ?? "Never" },
    { header: "Current No.", cell: (s) => Number(s.current_val) || 0 },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (s) => (
        <PermissionGate permission="business.manage">
          <IconButton label="Edit sequence" onClick={() => openDialog(s)}>
            <Pencil className="size-4" />
          </IconButton>
        </PermissionGate>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Document Numbering"
        subtitle="Per-document number formats (prefix, date, padding, reset)"
        actions={
          <PermissionGate permission="business.manage">
            <Button size="sm" disabled={availableTypes.length === 0} onClick={() => openDialog()}>
              <Plus className="mr-1.5 size-4" /> Add Sequence
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(s) => s.doc_type}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No numbering sequences"
          emptyDescription="Add a sequence to control how document numbers are generated."
        />
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`${editing ? "Edit" : "Add"} Numbering Sequence`}
        description={`Preview: ${preview(form) || "—"}`}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={!form.doc_type || save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Document Type" required className="sm:col-span-2">
            <Select
              value={form.doc_type}
              disabled={!!editing}
              onChange={(e) => set("doc_type", e.target.value)}
            >
              <option value="">Select…</option>
              {(editing ? DOC_TYPES : availableTypes).map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prefix" help="e.g. PAY, RPT">
            <Input value={form.prefix ?? ""} onChange={(e) => set("prefix", e.target.value)} />
          </Field>
          <Field label="Separator">
            <Input value={form.separator ?? ""} onChange={(e) => set("separator", e.target.value)} />
          </Field>
          <Field label="Date Format" help="YYYY, YYYYMMDD, MMYY — empty = none">
            <Select value={form.date_format ?? ""} onChange={(e) => set("date_format", e.target.value)}>
              <option value="">None</option>
              <option value="YYYY">YYYY</option>
              <option value="YYYYMMDD">YYYYMMDD</option>
              <option value="YYMMDD">YYMMDD</option>
              <option value="MMYY">MMYY</option>
            </Select>
          </Field>
          <Field label="Padding" help="Min digits in the running number">
            <Input
              type="number"
              min={0}
              max={12}
              value={form.padding ?? 0}
              onChange={(e) => set("padding", Math.max(0, Number(e.target.value) || 0))}
            />
          </Field>
          <Field label="Reset Frequency" className="sm:col-span-2">
            <Select value={form.reset_freq ?? "never"} onChange={(e) => set("reset_freq", e.target.value)}>
              {RESET_FREQUENCIES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
