"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card } from "@/components/ui/base";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import {
  useMetricCategories,
  usePerformanceMetrics,
  useSaveMetricCategory,
  useSavePerformanceMetric,
} from "@/hooks/use-performance";
import { normalizeList } from "@/lib/api/drf";
import {
  METRIC_TYPES,
  type MetricCategory,
  type PerformanceMetric,
} from "@/lib/api/performance";

const MANAGE = "hrm.performance.manage";

function CategoriesCard({ categories }: { categories: MetricCategory[] }) {
  const save = useSaveMetricCategory();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", order: 0 });

  const columns: Column<MetricCategory>[] = [
    { header: "Category", cell: (c) => <span className="font-medium">{c.name || "—"}</span> },
    { header: "Description", cell: (c) => c.description || "—" },
    { header: "Order", cell: (c) => c.order ?? 0 },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-sm font-bold">Metric Categories</h3>
        <PermissionGate permission={MANAGE}>
          <Button size="sm" onClick={() => { setForm({ name: "", description: "", order: 0 }); setOpen(true); }}>
            <Plus className="mr-1.5 size-4" /> Add Category
          </Button>
        </PermissionGate>
      </div>
      <DataTable columns={columns} rows={categories} rowKey={(c) => c.id} emptyTitle="No categories yet" />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add Metric Category"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={save.isPending}>Cancel</Button>
            <Button size="sm" disabled={!form.name.trim() || save.isPending}
              onClick={() => save.mutate(form, { onSuccess: () => setOpen(false) })}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <Field label="Order"><Input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))} /></Field>
        </div>
      </Dialog>
    </Card>
  );
}

function MetricsCard({ categories, metrics }: { categories: MetricCategory[]; metrics: PerformanceMetric[] }) {
  const save = useSavePerformanceMetric();
  const [open, setOpen] = useState(false);
  const empty = { category_id: "", name: "", description: "", metric_type: "numeric", unit: "", min_value: "", max_value: "", target_value: "" };
  const [form, setForm] = useState(empty);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const catName = useMemo(() => {
    const m = new Map(categories.map((c) => [c.id, c.name]));
    return (id?: string) => (id ? m.get(id) ?? "—" : "—");
  }, [categories]);

  const columns: Column<PerformanceMetric>[] = [
    { header: "Metric", cell: (m) => <span className="font-medium">{m.name || "—"}</span> },
    { header: "Category", cell: (m) => m.category_name || catName(m.category_id) },
    { header: "Type", cell: (m) => METRIC_TYPES.find((t) => t.value === m.metric_type)?.label ?? m.metric_type ?? "—" },
    { header: "Unit", cell: (m) => m.unit || "—" },
    { header: "Target", cell: (m) => (m.target_value != null && m.target_value !== "" ? String(m.target_value) : "—") },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-sm font-bold">Metrics</h3>
        <PermissionGate permission={MANAGE}>
          <Button size="sm" disabled={categories.length === 0}
            onClick={() => { setForm({ ...empty, category_id: categories[0]?.id ?? "" }); setOpen(true); }}>
            <Plus className="mr-1.5 size-4" /> Add Metric
          </Button>
        </PermissionGate>
      </div>
      <DataTable columns={columns} rows={metrics} rowKey={(m) => m.id} emptyTitle="No metrics yet"
        emptyDescription="Add a category first, then define metrics under it." />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add Metric"
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={save.isPending}>Cancel</Button>
            <Button size="sm" disabled={!form.name.trim() || !form.category_id || save.isPending}
              onClick={() => save.mutate(form, { onSuccess: () => setOpen(false) })}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" required>
            <Select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Name" required><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Type">
            <Select value={form.metric_type} onChange={(e) => set("metric_type", e.target.value)}>
              {METRIC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Unit" help="e.g. %, calls, KES"><Input value={form.unit} onChange={(e) => set("unit", e.target.value)} /></Field>
          <Field label="Min Value"><Input type="number" value={form.min_value} onChange={(e) => set("min_value", e.target.value)} /></Field>
          <Field label="Max Value"><Input type="number" value={form.max_value} onChange={(e) => set("max_value", e.target.value)} /></Field>
          <Field label="Default Target"><Input type="number" value={form.target_value} onChange={(e) => set("target_value", e.target.value)} /></Field>
          <Field label="Description" className="sm:col-span-2"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
        </div>
      </Dialog>
    </Card>
  );
}

export default function PerformanceMetricsPage() {
  const { data: catData } = useMetricCategories({ page_size: 200 });
  const { data: metricData } = usePerformanceMetrics({ page_size: 200 });
  const categories = normalizeList<MetricCategory>(catData).results;
  const metrics = normalizeList<PerformanceMetric>(metricData).results;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Performance Metrics" subtitle="Define the categories and metrics used to score performance" />
      <CategoriesCard categories={categories} />
      <MetricsCard categories={categories} metrics={metrics} />
    </div>
  );
}
