"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button, Card } from "@/components/ui/base";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { usePlannerResolve } from "@/hooks/use-attendance";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { type PlannerCell } from "@/lib/api/attendance";
import { formatDateParts } from "@/lib/format";

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

export default function ShiftPlannerPage() {
  const { options: employees } = useEmployeeOptions();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

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

  // Index resolved cells by employee + date.
  const byKey = useMemo(() => {
    const m = new Map<string, PlannerCell>();
    for (const c of cells) m.set(`${c.employee}|${c.date?.slice(0, 10)}`, c);
    return m;
  }, [cells]);

  // Employees that appear in the resolved data; fall back to the full directory.
  const rows = useMemo(() => {
    const present = new Map<string, string>();
    for (const c of cells) {
      if (c.employee != null) present.set(String(c.employee), c.employee_name || `#${c.employee}`);
    }
    if (present.size) return Array.from(present, ([id, name]) => ({ id, name }));
    return employees.slice(0, 30).map((o) => ({ id: o.value, name: o.label }));
  }, [cells, employees]);

  const shiftWeek = (delta: number) =>
    setWeekStart((w) => new Date(w.getTime() + delta * 7 * 86400000));

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Shift Planner"
        subtitle="Weekly roster across employees"
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
                    <th key={iso(d)} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground">
                      <div>{formatDateParts(d, { weekday: "short" })}</div>
                      <div className="font-normal">{d.getDate()}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((emp) => (
                  <tr key={emp.id} className="border-b border-border/60">
                    <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium text-foreground">
                      {emp.name}
                    </td>
                    {days.map((d) => {
                      const c = byKey.get(`${emp.id}|${iso(d)}`);
                      return (
                        <td key={iso(d)} className="px-2 py-2 text-center align-middle">
                          {c?.shift_name ? (
                            <span className="inline-flex flex-col rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                              <span className="font-semibold">{c.shift_name}</span>
                              {c.start_time && (
                                <span className="text-[10px] opacity-80">
                                  {c.start_time}–{c.end_time}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        Roster is resolved from shift assignments, rotations and per-date overrides.
      </p>
    </div>
  );
}
