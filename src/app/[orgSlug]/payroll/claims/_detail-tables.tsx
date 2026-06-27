"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/base";
import { Input, Select } from "@/components/ui/form";
import { IconButton } from "@/components/ui/tooltip";
import {
  useAddClaimItem,
  useAddMileageRoute,
  useClaimItems,
  useDeleteClaimItem,
  useDeleteMileageRoute,
  useMileageRoutes,
} from "@/hooks/use-payroll";
import { formatMoney } from "@/lib/utils";

const EXPENSE_TYPES = [
  { value: "tt", label: "Travel & Transport" },
  { value: "ac", label: "Accommodation" },
  { value: "ml", label: "Meals" },
  { value: "jm", label: "Conference / Meeting" },
  { value: "mh", label: "Medical" },
  { value: "tr", label: "Training" },
  { value: "os", label: "Office Supplies" },
  { value: "mlg", label: "Mileage" },
];

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const cellInput =
  "h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

/** Itemised expense lines for reimbursement / other claims. amount = qty × unit_cost. */
export function ClaimItemsTable({ claimId }: { claimId: string }) {
  const { data: items = [], isLoading } = useClaimItems(claimId);
  const add = useAddClaimItem(claimId);
  const del = useDeleteClaimItem(claimId);

  const [draft, setDraft] = useState({
    date: "",
    expense_type: "tt",
    description: "",
    quantity: "1",
    unit_cost: "",
  });
  const draftAmount = num(draft.quantity) * num(draft.unit_cost);
  const total = items.reduce((s, it) => s + num(it.amount), 0);

  const addRow = () => {
    if (!draft.description.trim() || draftAmount <= 0) return;
    add.mutate(
      {
        date: draft.date || undefined,
        expense_type: draft.expense_type,
        description: draft.description,
        quantity: draft.quantity,
        unit_cost: draft.unit_cost,
        amount: String(draftAmount),
      },
      {
        onSuccess: () =>
          setDraft({ date: "", expense_type: "tt", description: "", quantity: "1", unit_cost: "" }),
      },
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
            <th className="px-2 py-2">Date</th>
            <th className="px-2 py-2">Type</th>
            <th className="px-2 py-2">Description</th>
            <th className="px-2 py-2 text-right">Qty</th>
            <th className="px-2 py-2 text-right">Unit Cost</th>
            <th className="px-2 py-2 text-right">Amount</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-border/60">
              <td className="px-2 py-2 text-muted-foreground">{it.date || "—"}</td>
              <td className="px-2 py-2">
                {EXPENSE_TYPES.find((e) => e.value === it.expense_type)?.label || it.expense_type || "—"}
              </td>
              <td className="px-2 py-2">{it.description || "—"}</td>
              <td className="px-2 py-2 text-right">{it.quantity ?? "—"}</td>
              <td className="px-2 py-2 text-right">{it.unit_cost != null ? formatMoney(it.unit_cost) : "—"}</td>
              <td className="px-2 py-2 text-right font-medium">{formatMoney(it.amount)}</td>
              <td className="px-2 py-2 text-right">
                <IconButton label="Remove line" onClick={() => del.mutate(it.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </IconButton>
              </td>
            </tr>
          ))}
          {!isLoading && items.length === 0 && (
            <tr>
              <td colSpan={7} className="px-2 py-6 text-center text-sm text-muted-foreground">
                No lines yet. Add the first expense line below.
              </td>
            </tr>
          )}
          {/* Draft row */}
          <tr className="bg-accent/5">
            <td className="px-2 py-2">
              <input
                type="date"
                className={cellInput}
                value={draft.date}
                onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              />
            </td>
            <td className="px-2 py-2">
              <Select
                value={draft.expense_type}
                onChange={(e) => setDraft((d) => ({ ...d, expense_type: e.target.value }))}
                className="h-9 py-1"
              >
                {EXPENSE_TYPES.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </Select>
            </td>
            <td className="px-2 py-2">
              <Input
                value={draft.description}
                placeholder="Description"
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                className="h-9 py-1"
              />
            </td>
            <td className="px-2 py-2">
              <input
                type="number"
                step="0.01"
                className={`${cellInput} w-20 text-right`}
                value={draft.quantity}
                onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))}
              />
            </td>
            <td className="px-2 py-2">
              <input
                type="number"
                step="0.01"
                className={`${cellInput} w-28 text-right`}
                value={draft.unit_cost}
                placeholder="0.00"
                onChange={(e) => setDraft((d) => ({ ...d, unit_cost: e.target.value }))}
              />
            </td>
            <td className="px-2 py-2 text-right font-medium">{formatMoney(draftAmount)}</td>
            <td className="px-2 py-2 text-right">
              <Button size="sm" variant="outline" onClick={addRow} disabled={add.isPending}>
                <Plus className="size-4" />
              </Button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-semibold">
            <td colSpan={5} className="px-2 py-2 text-right">
              Total
            </td>
            <td className="px-2 py-2 text-right">{formatMoney(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Mileage trip lines. amount = distance × rate. */
export function MileageTable({ claimId }: { claimId: string }) {
  const { data: routes = [], isLoading } = useMileageRoutes(claimId);
  const add = useAddMileageRoute(claimId);
  const del = useDeleteMileageRoute(claimId);

  const [draft, setDraft] = useState({ date: "", from: "", to: "", distance: "", rate: "" });
  const draftAmount = num(draft.distance) * num(draft.rate);
  const total = routes.reduce((s, r) => s + num(r.amount), 0);

  const addRow = () => {
    if (!draft.from.trim() || !draft.to.trim() || draftAmount <= 0) return;
    add.mutate(
      {
        date: draft.date || undefined,
        from: draft.from,
        to: draft.to,
        distance: draft.distance,
        rate: draft.rate,
        amount: String(draftAmount),
      },
      { onSuccess: () => setDraft({ date: "", from: "", to: "", distance: "", rate: "" }) },
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
            <th className="px-2 py-2">Date</th>
            <th className="px-2 py-2">From</th>
            <th className="px-2 py-2">To</th>
            <th className="px-2 py-2 text-right">Distance (km)</th>
            <th className="px-2 py-2 text-right">Rate</th>
            <th className="px-2 py-2 text-right">Amount</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {routes.map((r) => (
            <tr key={r.id} className="border-b border-border/60">
              <td className="px-2 py-2 text-muted-foreground">{r.date || "—"}</td>
              <td className="px-2 py-2">{r.from || r.from_location || "—"}</td>
              <td className="px-2 py-2">{r.to || r.to_location || "—"}</td>
              <td className="px-2 py-2 text-right">{r.distance ?? "—"}</td>
              <td className="px-2 py-2 text-right">{r.rate != null ? formatMoney(r.rate) : "—"}</td>
              <td className="px-2 py-2 text-right font-medium">{formatMoney(r.amount)}</td>
              <td className="px-2 py-2 text-right">
                <IconButton label="Remove route" onClick={() => del.mutate(r.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </IconButton>
              </td>
            </tr>
          ))}
          {!isLoading && routes.length === 0 && (
            <tr>
              <td colSpan={7} className="px-2 py-6 text-center text-sm text-muted-foreground">
                No routes yet. Add a trip below.
              </td>
            </tr>
          )}
          <tr className="bg-accent/5">
            <td className="px-2 py-2">
              <input
                type="date"
                className={cellInput}
                value={draft.date}
                onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              />
            </td>
            <td className="px-2 py-2">
              <Input
                value={draft.from}
                placeholder="Origin"
                onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                className="h-9 py-1"
              />
            </td>
            <td className="px-2 py-2">
              <Input
                value={draft.to}
                placeholder="Destination"
                onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                className="h-9 py-1"
              />
            </td>
            <td className="px-2 py-2">
              <input
                type="number"
                step="0.01"
                className={`${cellInput} w-24 text-right`}
                value={draft.distance}
                placeholder="0"
                onChange={(e) => setDraft((d) => ({ ...d, distance: e.target.value }))}
              />
            </td>
            <td className="px-2 py-2">
              <input
                type="number"
                step="0.01"
                className={`${cellInput} w-24 text-right`}
                value={draft.rate}
                placeholder="0.00"
                onChange={(e) => setDraft((d) => ({ ...d, rate: e.target.value }))}
              />
            </td>
            <td className="px-2 py-2 text-right font-medium">{formatMoney(draftAmount)}</td>
            <td className="px-2 py-2 text-right">
              <Button size="sm" variant="outline" onClick={addRow} disabled={add.isPending}>
                <Plus className="size-4" />
              </Button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-semibold">
            <td colSpan={5} className="px-2 py-2 text-right">
              Total
            </td>
            <td className="px-2 py-2 text-right">{formatMoney(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Per-diem editor: days × rate → amount. Reports the computed amount up so the header total
 * can be saved (no child resource on the backend — amount lives on the claim header). */
export function PerDiemEditor({
  days,
  rate,
  onChange,
}: {
  days: string;
  rate: string;
  onChange: (next: { days: string; rate: string; amount: number }) => void;
}) {
  const amount = num(days) * num(rate);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-foreground">Number of Days</label>
        <Input
          type="number"
          step="0.5"
          value={days}
          placeholder="0"
          onChange={(e) => onChange({ days: e.target.value, rate, amount: num(e.target.value) * num(rate) })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-foreground">Daily Rate</label>
        <Input
          type="number"
          step="0.01"
          value={rate}
          placeholder="0.00"
          onChange={(e) => onChange({ days, rate: e.target.value, amount: num(days) * num(e.target.value) })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-foreground">Amount</label>
        <div className="flex h-10 items-center rounded-lg border border-input bg-muted px-3 text-sm font-semibold">
          {formatMoney(amount)}
        </div>
      </div>
    </div>
  );
}
