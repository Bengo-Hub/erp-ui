"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Card, CardContent } from "@/components/ui/base";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { useLeaveCategories, useSaveLeaveRequest } from "@/hooks/use-leave";
import { normalizeList } from "@/lib/api/drf";
import { type LeaveCategory } from "@/lib/api/leave";

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const orgSlug = (useParams()?.orgSlug as string) ?? "";

  const { options: employees } = useEmployeeOptions();
  const { data: catData } = useLeaveCategories({ page_size: 200 });
  const categories = normalizeList<LeaveCategory>(catData).results;
  const save = useSaveLeaveRequest();

  const [form, setForm] = useState({
    employee: "",
    leave_category: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const valid = form.employee && form.leave_category && form.start_date && form.end_date;

  const submit = () => {
    if (!valid) return;
    save.mutate(
      {
        data: {
          employee: Number(form.employee),
          leave_category: Number(form.leave_category),
          start_date: form.start_date,
          end_date: form.end_date,
          reason: form.reason || undefined,
        },
      },
      { onSuccess: () => router.push(`/${orgSlug}/hrm/leave/requests`) },
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Apply for Leave"
        subtitle="Submit a new leave request for approval"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-1.5 size-4" /> Back
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="space-y-4">
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
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
              />
            </Field>
            <Field label="End Date" htmlFor="end_date" required>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(e) => set("end_date", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Reason" htmlFor="reason" className="sm:col-span-2">
            <Textarea
              id="reason"
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              placeholder="Reason for leave (optional)…"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => router.back()} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={!valid || save.isPending}>
              {save.isPending ? "Submitting…" : "Submit Request"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
