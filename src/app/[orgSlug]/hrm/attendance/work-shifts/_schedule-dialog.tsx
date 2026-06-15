"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Switch } from "@/components/ui/form";
import { useShiftSchedules, useUpsertShiftSchedule } from "@/hooks/use-attendance";
import { normalizeList } from "@/lib/api/drf";
import { type WorkShift, type WorkShiftSchedule } from "@/lib/api/attendance";

const DAYS: WorkShiftSchedule["day"][] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type Row = {
  day: WorkShiftSchedule["day"];
  start_time: string;
  end_time: string;
  break_hours: string;
  is_working_day: boolean;
};

/**
 * Day-wise schedule editor for a work shift. The erp-api stores one
 * WorkShiftSchedule row per (shift, day); this edits all seven days and
 * upserts each via PUT /hrm/attendance/shifts/{id}/schedules (one per day).
 */
export function ScheduleDialog({ shift, onClose }: { shift: WorkShift | null; onClose: () => void }) {
  const shiftId = shift?.id ?? null;
  const { data, isLoading } = useShiftSchedules(shiftId);
  const upsert = useUpsertShiftSchedule();

  const existing = useMemo(
    () => normalizeList<WorkShiftSchedule>(data).results,
    [data],
  );

  const openKey = shift ? String(shift.id) : "";
  const [draft, setDraft] = useState<{ key: string; rows: Row[] }>({ key: "", rows: [] });

  // Seed the draft from server rows (falling back to the shift's own start/end)
  // whenever a new shift is opened or its schedules load.
  const seedKey = `${openKey}:${existing.length}`;
  if (shift && draft.key !== seedKey && !isLoading) {
    const byDay = new Map(existing.map((s) => [s.day, s]));
    setDraft({
      key: seedKey,
      rows: DAYS.map((day) => {
        const s = byDay.get(day);
        const weekend = day === "Saturday" || day === "Sunday";
        return {
          day,
          start_time: (s?.start_time as string) || (shift.start_time as string) || "08:00",
          end_time: (s?.end_time as string) || (shift.end_time as string) || "17:00",
          break_hours: s?.break_hours != null ? String(s.break_hours) : "1",
          is_working_day: s ? !!s.is_working_day : !weekend,
        };
      }),
    });
  }

  if (!shift) return null;
  const busy = upsert.isPending;

  const setRow = (i: number, patch: Partial<Row>) =>
    setDraft((d) => ({ ...d, rows: d.rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));

  const save = async () => {
    if (shiftId == null) return;
    try {
      for (const r of draft.rows) {
        await upsert.mutateAsync({ shiftId, data: r });
      }
      toast.success("Schedule saved");
      onClose();
    } catch {
      // per-row error toast already surfaced by the mutation's onError
    }
  };

  return (
    <Dialog
      open={!!shift}
      onClose={onClose}
      title={`Weekly schedule — ${shift.name || "Shift"}`}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={busy || isLoading}>
            {busy ? "Saving…" : "Save schedule"}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <p className="p-4 text-sm text-muted-foreground">Loading schedule…</p>
      ) : (
        <div className="space-y-2">
          <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
            <span>Day</span>
            <span>Start</span>
            <span>End</span>
            <span>Break (h)</span>
            <span>Working</span>
          </div>
          {draft.rows.map((r, i) => (
            <div
              key={r.day}
              className="grid grid-cols-2 items-center gap-2 rounded-md border border-border p-2 sm:grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr]"
            >
              <span className="text-sm font-medium">{r.day}</span>
              <Field label="" className="!mb-0">
                <Input
                  type="time"
                  value={r.start_time}
                  disabled={!r.is_working_day}
                  onChange={(e) => setRow(i, { start_time: e.target.value })}
                />
              </Field>
              <Field label="" className="!mb-0">
                <Input
                  type="time"
                  value={r.end_time}
                  disabled={!r.is_working_day}
                  onChange={(e) => setRow(i, { end_time: e.target.value })}
                />
              </Field>
              <Field label="" className="!mb-0">
                <Input
                  type="number"
                  step="0.25"
                  value={r.break_hours}
                  disabled={!r.is_working_day}
                  onChange={(e) => setRow(i, { break_hours: e.target.value })}
                />
              </Field>
              <Switch
                id={`working-${r.day}`}
                checked={r.is_working_day}
                onChange={(c) => setRow(i, { is_working_day: c })}
              />
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}
