"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button, Card } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { Field, Input, Select } from "@/components/ui/form";
import { IconButton } from "@/components/ui/tooltip";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { usePieceRates, useSavePieceOutputs } from "@/hooks/use-piece-rate";
import { type PieceOutputInput } from "@/lib/api/piece-rate";
import { isoDay } from "@/lib/date-range";

interface Line {
  key: number;
  employee_id: string;
  piece_rate_id: string;
  quantity: string;
  rejected_quantity: string;
  note: string;
}

let seq = 0;
const blank = (rateId = ""): Line => ({ key: ++seq, employee_id: "", piece_rate_id: rateId, quantity: "", rejected_quantity: "0", note: "" });

/** A line is ready when it names a person and an operation, and QC rejects do not exceed the count. */
function ready(l: Line): boolean {
  const q = Number(l.quantity);
  const r = Number(l.rejected_quantity || 0);
  return !!l.employee_id && !!l.piece_rate_id && q > 0 && r >= 0 && r <= q;
}

/**
 * Daily output entry: one line per person and operation, with the quantity QC rejected. Saved
 * lines wait for approval before they reach payroll.
 */
export function EntryGrid() {
  const [date, setDate] = useState(isoDay());
  const [lines, setLines] = useState<Line[]>(() => [blank()]);
  const employees = useEmployeeOptions();
  const rates = usePieceRates({ limit: 200 });
  const save = useSavePieceOutputs();
  const rateOptions = rates.data?.data ?? [];

  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const filled = lines.filter((l) => l.employee_id || l.quantity);
  const allReady = filled.length > 0 && filled.every(ready);

  const submit = () => {
    const rows: PieceOutputInput[] = filled.map((l) => ({
      employee_id: l.employee_id,
      date,
      piece_rate_id: l.piece_rate_id,
      quantity: Number(l.quantity),
      rejected_quantity: Number(l.rejected_quantity || 0),
      note: l.note.trim() || undefined,
    }));
    save.mutate(rows, {
      onSuccess: ({ failed }) => {
        if (!failed) setLines([blank(lines[lines.length - 1]?.piece_rate_id)]);
      },
    });
  };

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">Record output</h2>
          <p className="text-xs text-muted-foreground">Rejected is the quantity QC failed. Only accepted units are paid.</p>
        </div>
        <Field label="Date" htmlFor="out-date" className="w-40">
          <Input id="out-date" type="date" value={date} max={isoDay()} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      <div className="space-y-3">
        {lines.map((l, i) => {
          const bad = (l.employee_id || l.quantity) && !ready(l);
          return (
            <div key={l.key} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-12 sm:items-end sm:border-0 sm:p-0">
              <Field label={i === 0 ? "Employee" : undefined} htmlFor={`e-${l.key}`} className="sm:col-span-3">
                <Combobox
                  id={`e-${l.key}`}
                  value={l.employee_id}
                  onChange={(v) => update(l.key, { employee_id: v })}
                  options={employees.options}
                  loading={employees.isLoading}
                  placeholder="Employee"
                />
              </Field>
              <Field label={i === 0 ? "Operation" : undefined} htmlFor={`r-${l.key}`} className="sm:col-span-3">
                <Select id={`r-${l.key}`} value={l.piece_rate_id} onChange={(e) => update(l.key, { piece_rate_id: e.target.value })}>
                  <option value="">Operation</option>
                  {rateOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.unit})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={i === 0 ? "Quantity" : undefined} htmlFor={`q-${l.key}`} className="sm:col-span-2">
                <Input id={`q-${l.key}`} type="number" min={0} inputMode="decimal" value={l.quantity} aria-invalid={!!bad} onChange={(e) => update(l.key, { quantity: e.target.value })} />
              </Field>
              <Field label={i === 0 ? "Rejected" : undefined} htmlFor={`x-${l.key}`} className="sm:col-span-1">
                <Input id={`x-${l.key}`} type="number" min={0} inputMode="decimal" value={l.rejected_quantity} onChange={(e) => update(l.key, { rejected_quantity: e.target.value })} />
              </Field>
              <Field label={i === 0 ? "Note" : undefined} htmlFor={`n-${l.key}`} className="sm:col-span-2">
                <Input id={`n-${l.key}`} value={l.note} maxLength={200} onChange={(e) => update(l.key, { note: e.target.value })} />
              </Field>
              <div className="flex justify-end sm:col-span-1">
                <IconButton label="Remove line" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [blank()]))}>
                  <Trash2 className="size-4 text-destructive" />
                </IconButton>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, blank(ls[ls.length - 1]?.piece_rate_id)])}>
          <Plus className="mr-1.5 size-4" /> Add line
        </Button>
        <Button size="sm" disabled={!allReady || save.isPending} onClick={submit}>
          {save.isPending ? "Saving" : `Save ${filled.length || ""} ${filled.length === 1 ? "line" : "lines"}`.replace("  ", " ")}
        </Button>
      </div>
      {!rates.isLoading && !rateOptions.length && (
        <p className="text-sm text-muted-foreground">Add piece rates under Payroll settings first.</p>
      )}
    </Card>
  );
}
