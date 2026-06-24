"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { useLeaveCategories, useSaveLeaveRequest } from "@/hooks/use-leave";
import { normalizeList } from "@/lib/api/drf";
import { type LeaveCategory } from "@/lib/api/leave";
import { endNotBeforeStart } from "@/lib/validation";

const EMPTY = { employee: "", leave_category: "", start_date: "", end_date: "", reason: "" };

const leaveSchema = z
  .object({
    employee: z.string().min(1, "Select an employee"),
    leave_category: z.string().min(1, "Select a leave type"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    reason: z.string().optional(),
  })
  .refine(endNotBeforeStart("start_date", "end_date"), {
    message: "End date must not be before start date",
    path: ["end_date"],
  });

/**
 * Apply-for-leave modal. Replaces the standalone /requests/new page so the form
 * opens in a responsive dialog over the list (consistent with the rest of the app).
 */
export function LeaveFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { options: employees } = useEmployeeOptions();
  const { data: catData } = useLeaveCategories({ page_size: 200 });
  const categories = normalizeList<LeaveCategory>(catData).results;
  const save = useSaveLeaveRequest();

  const [form, setForm] = useState(EMPTY);
  useEffect(() => {
    if (open) setForm(EMPTY);
  }, [open]);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const parsed = useMemo(() => leaveSchema.safeParse(form), [form]);
  const valid = parsed.success;
  const fieldErrors = parsed.success ? {} : parsed.error.flatten().fieldErrors;

  const submit = () => {
    if (!valid) return;
    save.mutate(
      {
        data: {
          // employee/category ids are UUID strings — do not Number() them.
          employee: form.employee,
          leave_category: form.leave_category,
          start_date: form.start_date,
          end_date: form.end_date,
          reason: form.reason || undefined,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Apply for Leave"
      description="Submit a new leave request for approval."
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!valid || save.isPending}>
            {save.isPending ? "Submitting…" : "Submit Request"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee" htmlFor="employee" required>
            <Select id="employee" value={form.employee} onChange={(e) => set("employee", e.target.value)}>
              <option value="">Select employee…</option>
              {employees.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Leave Type" htmlFor="leave_category" required>
            <Select
              id="leave_category"
              value={form.leave_category}
              onChange={(e) => set("leave_category", e.target.value)}
            >
              <option value="">Select type…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Start Date" htmlFor="start_date" required>
            <Input id="start_date" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
          </Field>
          <Field label="End Date" htmlFor="end_date" required error={fieldErrors.end_date?.[0]}>
            <Input id="end_date" type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
          </Field>
        </div>
        <Field label="Reason" htmlFor="reason">
          <Textarea
            id="reason"
            value={form.reason}
            onChange={(e) => set("reason", e.target.value)}
            placeholder="Reason for leave (optional)…"
          />
        </Field>
      </div>
    </Dialog>
  );
}
