"use client";

import { ChevronLeft, ChevronRight, Eraser, Paintbrush } from "lucide-react";
import { useMemo, useState } from "react";

import { Button, Card } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/tooltip";
import {
  useClearPlannerCell,
  usePlannerResolve,
  useUpsertPlannerCell,
  useWorkShifts,
} from "@/hooks/use-attendance";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { normalizeList } from "@/lib/api/drf";
import { type PlannerCell, type WorkShift } from "@/lib/api/attendance";
import { formatDateParts } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CellPopover, type ShiftPick } from "./_cell-popover";
import { OFF_COLOR, shiftColor } from "./_shift-colors";

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function isToday(d: Date) {
  return iso(d) === iso(new Date());
}

interface PendingClear {
  scope: "row" | "week";
  employeeId?: string;
  employeeName?: string;
}

export default function ShiftPlannerPage() {
  const { options: employees } = useEmployeeOptions();
  const { data: shiftsData } = useWorkShifts({ page_size: 200 });
  const shifts = useMemo(() => normalizeList<WorkShift>(shiftsData).results, [shiftsData]);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  // Active "brush": when set, clicking a cell paints this shift directly.
  const [brush, setBrush] = useState<string>("");
  // Open popover keyed by "employeeId|date".
  const [openCell, setOpenCell] = useState<string | null>(null);
  const [pendingClear, setPendingClear] = useState<PendingClear | null>(null);

  const upsert = useUpsertPlannerCell();
  const clear = useClearPlannerCell();

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 86400000)),
    [weekStart],
  );
  const range = useMemo(() => ({ from: iso(days[0]), to: iso(days[6]) }), [days]);

  const { data, isLoading, error, refetch } = usePlannerResolve(range);

  const cells: PlannerCell[] = useMemo(() => {
    if (Array.isArray(data)) return data;
    return data?.results ?? data?.data ?? [];
  }, [data]);

  const byKey = useMemo(() => {
    const m = new Map<string, PlannerCell>();
    for (const c of cells) m.set(`${c.employee}|${c.date?.slice(0, 10)}`, c);
    return m;
  }, [cells]);

  const rows = useMemo(() => {
    const present = new Map<string, string>();
    for (const c of cells) {
      if (c.employee != null) present.set(String(c.employee), c.employee_name || `#${c.employee}`);
    }
    if (present.size) return Array.from(present, ([id, name]) => ({ id, name }));
    return employees.slice(0, 30).map((o) => ({ id: o.value, name: o.label }));
  }, [cells, employees]);

  const shiftOptions = useMemo(
    () => shifts.map((s) => ({ value: String(s.id), label: s.name ?? `Shift ${s.id}` })),
    [shifts],
  );

  const shiftWeek = (delta: number) =>
    setWeekStart((w) => new Date(w.getTime() + delta * 7 * 86400000));

  // ---- Persistence helpers ----
  const assign = (employeeId: string, date: string, shift: WorkShift) =>
    upsert.mutate({
      employee_id: employeeId,
      date,
      work_shift_id: String(shift.id),
      start_time: shift.start_time,
      end_time: shift.end_time,
    });

  const markOff = (employeeId: string, date: string) =>
    upsert.mutate({ employee_id: employeeId, date, work_shift_id: "" });

  const clearCell = (employeeId: string, date: string) =>
    clear.mutate({ employeeId, date });

  const applyPick = (employeeId: string, date: string, pick: ShiftPick) => {
    if (pick.clear) clearCell(employeeId, date);
    else if (pick.off) markOff(employeeId, date);
    else if (pick.shift) assign(employeeId, date, pick.shift);
    setOpenCell(null);
  };

  // Click handler: brush mode paints directly; otherwise open the picker.
  const handleCellClick = (employeeId: string, date: string, key: string) => {
    const brushed = shifts.find((s) => String(s.id) === brush);
    if (brushed) {
      assign(employeeId, date, brushed);
      return;
    }
    setOpenCell((k) => (k === key ? null : key));
  };

  // Quick-fill an employee's whole visible week with the active brush shift.
  const fillRow = (employeeId: string) => {
    const brushed = shifts.find((s) => String(s.id) === brush);
    if (!brushed) return;
    for (const d of days) assign(employeeId, iso(d), brushed);
  };

  // ---- Bulk clears (confirmed) ----
  const runClear = () => {
    if (!pendingClear) return;
    if (pendingClear.scope === "row" && pendingClear.employeeId) {
      for (const d of days) clearCell(pendingClear.employeeId, iso(d));
    } else if (pendingClear.scope === "week") {
      for (const r of rows) for (const d of days) clearCell(r.id, iso(d));
    }
    setPendingClear(null);
  };

  const brushShift = shifts.find((s) => String(s.id) === brush);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Shift Planner"
        subtitle="Click a cell to roster a shift — or pick a brush and paint the week"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => shiftWeek(-1)} aria-label="Previous week">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 text-sm font-medium text-foreground">
              {formatDateParts(days[0], { month: "short", day: "numeric" })} –{" "}
              {formatDateParts(days[6], { month: "short", day: "numeric" })}
            </span>
            <Button variant="outline" size="sm" onClick={() => shiftWeek(1)} aria-label="Next week">
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              Today
            </Button>
          </div>
        }
      />

      {/* Brush + bulk-clear toolbar */}
      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center gap-2">
          <Paintbrush className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-xs font-semibold text-foreground">Brush</span>
          <div className="w-56">
            <Combobox
              value={brush}
              onChange={setBrush}
              options={shiftOptions}
              placeholder="Pick a shift to paint…"
              searchPlaceholder="Search shifts…"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {brushShift
            ? "Click cells to paint, or use the row fill button. Clear the brush to open the per-cell picker."
            : "No brush — click any cell to choose a shift."}
        </p>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPendingClear({ scope: "week" })}
            disabled={rows.length === 0}
          >
            <Eraser className="mr-1.5 size-4" /> Clear week
          </Button>
        </div>
      </Card>

      {/* Shift legend */}
      {shifts.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-xs">
          {shifts.map((s) => {
            const c = shiftColor(s.id);
            return (
              <span key={s.id} className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className={cn("size-2.5 rounded-full", c.dot)} aria-hidden />
                <span className="font-medium text-foreground">{s.name}</span>
                {(s.start_time || s.end_time) && (
                  <span className="opacity-70">
                    {s.start_time}–{s.end_time}
                  </span>
                )}
              </span>
            );
          })}
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className={cn("size-2.5 rounded-full", OFF_COLOR.dot)} aria-hidden />
            Off-duty
          </span>
        </div>
      )}

      <Card>
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No roster data"
            description="Assign shifts to employees to populate the planner."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/5">
                  <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Employee
                  </th>
                  {days.map((d) => (
                    <th
                      key={iso(d)}
                      className={cn(
                        "px-3 py-3 text-center text-xs font-semibold text-muted-foreground",
                        isToday(d) && "bg-primary/5 text-primary",
                      )}
                    >
                      <div>{formatDateParts(d, { weekday: "short" })}</div>
                      <div className="font-normal">{d.getDate()}</div>
                    </th>
                  ))}
                  <th className="px-2 py-3" aria-label="Row actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((emp) => (
                  <tr key={emp.id} className="border-b border-border/60">
                    <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium text-foreground">
                      {emp.name}
                    </td>
                    {days.map((d) => {
                      const date = iso(d);
                      const key = `${emp.id}|${date}`;
                      const c = byKey.get(key);
                      const hasShift = !!c?.shift_name && !c?.is_off;
                      const isOff = !!c?.is_off;
                      const color = hasShift
                        ? shiftColor(c?.work_shift_id ?? c?.shift_name)
                        : OFF_COLOR;
                      return (
                        <td key={date} className="relative px-2 py-2 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleCellClick(emp.id, date, key)}
                            aria-label={
                              hasShift
                                ? `${emp.name} ${date}: ${c?.shift_name}`
                                : `Assign shift for ${emp.name} on ${date}`
                            }
                            className={cn(
                              "flex min-h-[42px] w-full min-w-[68px] items-center justify-center rounded-md border px-2 py-1.5 text-xs transition-colors",
                              hasShift
                                ? cn(color.bg, color.text, color.border)
                                : isOff
                                  ? cn(OFF_COLOR.bg, OFF_COLOR.text, "border-dashed", OFF_COLOR.border)
                                  : "border-dashed border-border bg-transparent text-muted-foreground/40 hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                            )}
                          >
                            {hasShift ? (
                              <span className="flex flex-col leading-tight">
                                <span className="font-semibold">{c?.shift_name}</span>
                                {c?.start_time && (
                                  <span className="text-[10px] opacity-80">
                                    {c.start_time}–{c.end_time}
                                  </span>
                                )}
                              </span>
                            ) : isOff ? (
                              <span className="font-medium">Off</span>
                            ) : (
                              <span aria-hidden>+</span>
                            )}
                          </button>
                          {openCell === key && (
                            <CellPopover
                              shifts={shifts}
                              hasValue={!!c}
                              onPick={(pick) => applyPick(emp.id, date, pick)}
                              onClose={() => setOpenCell(null)}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-right align-middle">
                      <div className="flex justify-end gap-1">
                        <IconButton
                          label={brushShift ? `Fill week with ${brushShift.name}` : "Pick a brush to fill the row"}
                          onClick={() => fillRow(emp.id)}
                          disabled={!brushShift}
                        >
                          <Paintbrush className="size-4" />
                        </IconButton>
                        <IconButton
                          label="Clear this employee's week"
                          onClick={() =>
                            setPendingClear({ scope: "row", employeeId: emp.id, employeeName: emp.name })
                          }
                        >
                          <Eraser className="size-4 text-destructive" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Roster is resolved from shift assignments, rotations and per-date overrides. Changes save instantly.
      </p>

      <ConfirmDialog
        open={!!pendingClear}
        title={pendingClear?.scope === "row" ? "Clear this week's shifts?" : "Clear the whole week?"}
        description={
          pendingClear?.scope === "row"
            ? `Remove all rostered shifts for ${pendingClear?.employeeName ?? "this employee"} across the visible week.`
            : "Remove all rostered shifts for every employee in the visible week. This cannot be undone."
        }
        destructive
        confirmLabel="Clear"
        loading={clear.isPending}
        onCancel={() => setPendingClear(null)}
        onConfirm={runClear}
      />
    </div>
  );
}
