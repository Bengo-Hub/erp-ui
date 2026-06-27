"use client";

import { Ban, Eraser } from "lucide-react";
import { useEffect, useRef } from "react";

import { type WorkShift } from "@/lib/api/attendance";
import { cn } from "@/lib/utils";

import { shiftColor } from "./_shift-colors";

export interface ShiftPick {
  /** A real work shift to assign. */
  shift?: WorkShift;
  /** Explicit off-duty (empty work_shift_id). */
  off?: boolean;
  /** Remove the assignment entirely. */
  clear?: boolean;
}

/** Floating menu to assign / off / clear a single planner cell. */
export function CellPopover({
  shifts,
  hasValue,
  onPick,
  onClose,
}: {
  shifts: WorkShift[];
  hasValue: boolean;
  onPick: (pick: ShiftPick) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute left-1/2 top-full z-[120] mt-1 w-56 -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl"
    >
      <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Assign shift
      </p>
      <div className="max-h-56 overflow-y-auto">
        {shifts.length === 0 ? (
          <p className="px-2.5 py-3 text-xs text-muted-foreground">
            No work shifts defined yet.
          </p>
        ) : (
          shifts.map((s) => {
            const c = shiftColor(s.id);
            return (
              <button
                key={s.id}
                type="button"
                role="menuitem"
                onClick={() => onPick({ shift: s })}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-accent"
              >
                <span className={cn("size-3 shrink-0 rounded-full", c.dot)} aria-hidden />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{s.name}</span>
                {(s.start_time || s.end_time) && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {s.start_time}–{s.end_time}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
      <div className="mt-1 border-t border-border pt-1">
        <button
          type="button"
          role="menuitem"
          onClick={() => onPick({ off: true })}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
        >
          <Ban className="size-4 shrink-0" aria-hidden />
          Mark off-duty
        </button>
        {hasValue && (
          <button
            type="button"
            role="menuitem"
            onClick={() => onPick({ clear: true })}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
          >
            <Eraser className="size-4 shrink-0" aria-hidden />
            Clear cell
          </button>
        )}
      </div>
    </div>
  );
}
