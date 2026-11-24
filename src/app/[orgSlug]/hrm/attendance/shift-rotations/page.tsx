"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";

import { CrudManager, type CrudFieldDef } from "@/components/crud/crud-manager";
import { Badge } from "@/components/ui/base";
import { type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  useDeleteShiftRotation,
  useSaveShiftRotation,
  useShiftRotations,
  useWorkShifts,
} from "@/hooks/use-attendance";
import { normalizeList } from "@/lib/api/drf";
import { ROTATION_UNITS, type ShiftRotation, type WorkShift } from "@/lib/api/attendance";
import { PAGE_SIZE } from "@/lib/hrm";
import { formatDate } from "@/lib/utils";

/** Ordered multi-pick of work shifts: ticked shifts run in the order shown on the right. */
function ShiftPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const { data, isLoading } = useWorkShifts({ page_size: 200 });
  const shifts = normalizeList<WorkShift>(data).results;
  const name = (id: string) => shifts.find((s) => String(s.id) === id)?.name ?? "Unknown shift";
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const move = (i: number, d: number) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading shifts…</p>;
  if (!shifts.length) return <p className="text-sm text-muted-foreground">Create work shifts first.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        {shifts.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={value.includes(String(s.id))} onChange={() => toggle(String(s.id))} />
            <span>{s.name}</span>
            {s.start_time ? <span className="text-xs text-muted-foreground">{s.start_time}–{s.end_time ?? "?"}</span> : null}
          </label>
        ))}
      </div>
      <ol className="space-y-1 text-sm">
        {value.map((id, i) => (
          <li key={id} className="flex items-center gap-2">
            <span className="w-5 text-muted-foreground">{i + 1}.</span>
            <span className="flex-1">{name(id)}</span>
            <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="disabled:opacity-30">
              <ArrowUp className="size-3.5" />
            </button>
            <button type="button" aria-label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="disabled:opacity-30">
              <ArrowDown className="size-3.5" />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

const fields: CrudFieldDef[] = [
  { name: "title", label: "Title", required: true, span2: true, placeholder: "e.g. Day/night weekly swap" },
  {
    name: "shift_ids",
    label: "Shifts, in rotation order",
    span2: true,
    render: (_f, value, onChange) => <ShiftPicker value={ids(value)} onChange={onChange} />,
  },
  { name: "run_duration", label: "Each shift runs for", type: "number", required: true },
  { name: "run_unit", label: "Unit", type: "select", options: [...ROTATION_UNITS] },
  { name: "break_duration", label: "Break before the next shift", type: "number" },
  { name: "break_unit", label: "Break unit", type: "select", options: [...ROTATION_UNITS] },
  { name: "is_active", label: "Active", type: "switch" },
];

/** "1 week", "2 weeks": the API stores units like "Week", "Weeks" or "Months". */
function period(n?: number, unit?: string): string {
  if (n == null) return "—";
  const u = (unit || "day").toLowerCase().replace(/s$/, "");
  return `${n} ${u}${n === 1 ? "" : "s"}`;
}

/** Units are stored as the API received them; map any variant onto the select's values. */
function unitValue(unit?: string): string {
  const u = (unit || "").toLowerCase().replace(/s$/, "");
  return ROTATION_UNITS.find((o) => o.value.toLowerCase() === u)?.value ?? "Week";
}

export default function ShiftRotationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useShiftRotations({ page, page_size: PAGE_SIZE });
  const { data: shiftData } = useWorkShifts({ page_size: 200 });
  const save = useSaveShiftRotation();
  const del = useDeleteShiftRotation();
  const { results: rows, count } = normalizeList<ShiftRotation>(data);

  const shiftNames = useMemo(() => {
    const m = new Map(normalizeList<WorkShift>(shiftData).results.map((s) => [String(s.id), s.name ?? ""]));
    return (r: ShiftRotation) =>
      r.shift_names?.length ? r.shift_names : (r.shift_ids ?? []).map((id) => m.get(String(id))).filter(Boolean);
  }, [shiftData]);

  const columns: Column<ShiftRotation>[] = [
    { header: "Title", cell: (r) => <span className="font-medium">{r.title || "—"}</span> },
    { header: "Shifts", cell: (r) => shiftNames(r).join(" → ") || "—" },
    {
      header: "Runs",
      cell: (r) => (
        <div>
          <span>{period(r.run_duration, r.run_unit)} each</span>
          {r.break_duration ? (
            <span className="block text-xs text-muted-foreground">{period(r.break_duration, r.break_unit)} break between</span>
          ) : null}
        </div>
      ),
    },
    { header: "Next change", cell: (r) => (r.next_change_date ? formatDate(r.next_change_date) : "—") },
    {
      header: "Status",
      cell: (r) => (
        <Badge variant={r.is_active === false ? "secondary" : "success"}>
          {r.is_active === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Shift Rotations" subtitle="Rotating shift schedules for teams" />
      <CrudManager
        rows={rows}
        columns={columns}
        fields={fields}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        entityLabel="Shift Rotation"
        perms={{ add: "add_shiftrotation", change: "change_shiftrotation", delete: "delete_shiftrotation" }}
        emptyDescription="No shift rotations defined yet."
        toForm={(r) => ({
          title: r?.title ?? "",
          shift_ids: (r?.shift_ids ?? []).map(String),
          run_duration: r?.run_duration ?? 1,
          run_unit: unitValue(r?.run_unit),
          break_duration: r?.break_duration ?? 0,
          break_unit: r ? unitValue(r.break_unit) : "Day",
          is_active: r?.is_active ?? true,
        })}
        onSave={({ id, data }, done) =>
          save.mutate(
            {
              id,
              data: {
                title: String(data.title ?? "").trim(),
                shift_ids: ids(data.shift_ids),
                run_duration: Math.max(1, Math.trunc(Number(data.run_duration) || 1)),
                run_unit: String(data.run_unit || "Week"),
                break_duration: Math.max(0, Math.trunc(Number(data.break_duration) || 0)),
                break_unit: String(data.break_unit || "Day"),
                is_active: data.is_active !== false,
              },
            },
            { onSuccess: done },
          )
        }
        onDelete={(id, done) => del.mutate(id, { onSuccess: done })}
        saving={save.isPending}
        deleting={del.isPending}
        pagination={{ page, pageSize: PAGE_SIZE, total: count, onPageChange: setPage }}
      />
    </div>
  );
}
