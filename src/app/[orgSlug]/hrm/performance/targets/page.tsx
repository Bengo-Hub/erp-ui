"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import {
  useEmployeeMetrics,
  useMetricTargets,
  usePerformanceMetrics,
  useRecordEmployeeMetric,
  useSetMetricTarget,
} from "@/hooks/use-performance";
import { normalizeList } from "@/lib/api/drf";
import {
  type EmployeeMetric,
  type MetricTarget,
  type PerformanceMetric,
} from "@/lib/api/performance";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";

const MANAGE = "hrm.performance.manage";

export default function PerformanceTargetsPage() {
  const { options: employees } = useEmployeeOptions();
  const { data: metricData } = usePerformanceMetrics({ page_size: 200 });
  const metrics = normalizeList<PerformanceMetric>(metricData).results;

  const nameOf = (opts: { value: string; label: string }[]) => {
    const m = new Map(opts.map((o) => [o.value, o.label]));
    return (id?: string) => (id ? m.get(String(id)) ?? "—" : "—");
  };
  const empName = useMemo(() => nameOf(employees), [employees]);
  const metricOpts = useMemo(() => metrics.map((m) => ({ value: m.id, label: m.name ?? m.id })), [metrics]);
  const metricName = useMemo(() => nameOf(metricOpts), [metricOpts]);

  // ---- Targets ----
  const [tPage, setTPage] = useState(1);
  const { data: tData, isLoading: tLoading, error: tError, refetch: tRefetch } = useMetricTargets({ page: tPage, page_size: PAGE_SIZE });
  const { results: targets, count: tCount } = normalizeList<MetricTarget>(tData);
  const setTarget = useSetMetricTarget();
  const [tOpen, setTOpen] = useState(false);
  const emptyTarget = { employee_id: "", metric_id: "", target_value: "", period_start: "", period_end: "" };
  const [tForm, setTForm] = useState(emptyTarget);
  const setT = (k: string, v: string) => setTForm((f) => ({ ...f, [k]: v }));
  const tValid = tForm.employee_id && tForm.metric_id && tForm.target_value && tForm.period_start && tForm.period_end;

  // ---- Recorded values ----
  const [vPage, setVPage] = useState(1);
  const { data: vData, isLoading: vLoading, error: vError, refetch: vRefetch } = useEmployeeMetrics({ page: vPage, page_size: PAGE_SIZE });
  const { results: values, count: vCount } = normalizeList<EmployeeMetric>(vData);
  const record = useRecordEmployeeMetric();
  const [vOpen, setVOpen] = useState(false);
  const emptyValue = { employee_id: "", metric_id: "", value: "", date_recorded: "", notes: "" };
  const [vForm, setVForm] = useState(emptyValue);
  const setV = (k: string, v: string) => setVForm((f) => ({ ...f, [k]: v }));
  const vValid = vForm.employee_id && vForm.metric_id && vForm.value;

  const targetCols: Column<MetricTarget>[] = [
    { header: "Employee", cell: (t) => <span className="font-medium">{t.employee_name || empName(t.employee_id)}</span> },
    { header: "Metric", cell: (t) => t.metric_name || metricName(t.metric_id) },
    { header: "Target", cell: (t) => String(t.target_value ?? "—") },
    { header: "Period", cell: (t) => `${t.period_start ? formatDate(t.period_start) : "?"} – ${t.period_end ? formatDate(t.period_end) : "?"}` },
  ];
  const valueCols: Column<EmployeeMetric>[] = [
    { header: "Employee", cell: (v) => <span className="font-medium">{v.employee_name || empName(v.employee_id)}</span> },
    { header: "Metric", cell: (v) => v.metric_name || metricName(v.metric_id) },
    { header: "Value", cell: (v) => String(v.value ?? "—") },
    { header: "Recorded", cell: (v) => (v.date_recorded ? formatDate(v.date_recorded) : "—") },
    { header: "Notes", cell: (v) => v.notes || "—" },
  ];

  const noMetrics = metricOpts.length === 0;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Targets & Scores" subtitle="Set per-employee metric targets and record measured values" />

      <Card>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-sm font-bold">Metric Targets</h3>
          <PermissionGate permission={MANAGE}>
            <Button size="sm" disabled={noMetrics} onClick={() => { setTForm(emptyTarget); setTOpen(true); }}>
              <Plus className="mr-1.5 size-4" /> Set Target
            </Button>
          </PermissionGate>
        </div>
        <DataTable columns={targetCols} rows={targets} rowKey={(t) => t.id} isLoading={tLoading} error={tError}
          onRetry={tRefetch} emptyTitle="No targets set" emptyDescription={noMetrics ? "Define metrics first." : "Set a metric target for an employee."} />
        {tCount > 0 && <div className="border-t border-border p-3"><Pagination page={tPage} pageSize={PAGE_SIZE} total={tCount} onPageChange={setTPage} /></div>}
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-sm font-bold">Recorded Values</h3>
          <PermissionGate permission={MANAGE}>
            <Button size="sm" disabled={noMetrics} onClick={() => { setVForm(emptyValue); setVOpen(true); }}>
              <Plus className="mr-1.5 size-4" /> Record Value
            </Button>
          </PermissionGate>
        </div>
        <DataTable columns={valueCols} rows={values} rowKey={(v) => v.id} isLoading={vLoading} error={vError}
          onRetry={vRefetch} emptyTitle="No values recorded" emptyDescription={noMetrics ? "Define metrics first." : "Record a measured metric value."} />
        {vCount > 0 && <div className="border-t border-border p-3"><Pagination page={vPage} pageSize={PAGE_SIZE} total={vCount} onPageChange={setVPage} /></div>}
      </Card>

      <Dialog open={tOpen} onClose={() => setTOpen(false)} title="Set Metric Target" maxWidth="max-w-2xl"
        footer={<>
          <Button variant="outline" size="sm" onClick={() => setTOpen(false)} disabled={setTarget.isPending}>Cancel</Button>
          <Button size="sm" disabled={!tValid || setTarget.isPending} onClick={() => setTarget.mutate(tForm, { onSuccess: () => setTOpen(false) })}>
            {setTarget.isPending ? "Saving…" : "Save"}
          </Button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee" required><Select value={tForm.employee_id} onChange={(e) => setT("employee_id", e.target.value)}>
            <option value="">Select…</option>{employees.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></Field>
          <Field label="Metric" required><Select value={tForm.metric_id} onChange={(e) => setT("metric_id", e.target.value)}>
            <option value="">Select…</option>{metricOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></Field>
          <Field label="Target Value" required><Input type="number" value={tForm.target_value} onChange={(e) => setT("target_value", e.target.value)} /></Field>
          <Field label="Period Start" required><Input type="date" value={tForm.period_start} onChange={(e) => setT("period_start", e.target.value)} /></Field>
          <Field label="Period End" required><Input type="date" value={tForm.period_end} onChange={(e) => setT("period_end", e.target.value)} /></Field>
        </div>
      </Dialog>

      <Dialog open={vOpen} onClose={() => setVOpen(false)} title="Record Metric Value" maxWidth="max-w-2xl"
        footer={<>
          <Button variant="outline" size="sm" onClick={() => setVOpen(false)} disabled={record.isPending}>Cancel</Button>
          <Button size="sm" disabled={!vValid || record.isPending} onClick={() => record.mutate(vForm, { onSuccess: () => setVOpen(false) })}>
            {record.isPending ? "Saving…" : "Save"}
          </Button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee" required><Select value={vForm.employee_id} onChange={(e) => setV("employee_id", e.target.value)}>
            <option value="">Select…</option>{employees.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></Field>
          <Field label="Metric" required><Select value={vForm.metric_id} onChange={(e) => setV("metric_id", e.target.value)}>
            <option value="">Select…</option>{metricOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></Field>
          <Field label="Value" required><Input type="number" value={vForm.value} onChange={(e) => setV("value", e.target.value)} /></Field>
          <Field label="Date Recorded"><Input type="date" value={vForm.date_recorded} onChange={(e) => setV("date_recorded", e.target.value)} /></Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea value={vForm.notes} onChange={(e) => setV("notes", e.target.value)} /></Field>
        </div>
      </Dialog>
    </div>
  );
}
