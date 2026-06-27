"use client";

import { ArrowLeft, Mail } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent, CardHeader } from "@/components/ui/base";
import { Field, Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { useEmployees } from "@/hooks/use-employees";
import { useEmailPayslips } from "@/hooks/use-payroll";
import { normalizeList } from "@/lib/api/drf";
import { type Employee } from "@/lib/api/employees";
import { employeeName } from "@/lib/hrm";

export default function EmailPayslipsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;

  const [month, setMonth] = useState("");
  const [message, setMessage] = useState(
    "<p>Please find attached your pay slip for the month of …</p><p>Regards,<br/>Payroll</p>",
  );
  const [sendTime, setSendTime] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const debounced = useDebounce(search);

  const { data } = useEmployees({ page: 1, page_size: 500, search: debounced || undefined });
  const employees = useMemo(
    () => normalizeList<Employee>(data).results.filter((e) => e.email),
    [data],
  );
  const email = useEmailPayslips();

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const allChecked = employees.length > 0 && employees.every((e) => selected[String(e.id)]);
  const toggleAll = () =>
    setSelected(allChecked ? {} : Object.fromEntries(employees.map((e) => [String(e.id), true])));

  const submit = () => {
    if (!month) {
      toast.error("Choose a payroll month");
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Select at least one employee");
      return;
    }
    email.mutate(
      {
        payment_period: month,
        message,
        employee_ids: selectedIds,
        send_time: sendTime ? new Date(sendTime).toISOString() : undefined,
      },
      { onSuccess: () => router.push(`/${orgSlug}/payroll/payslips`) },
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push(`/${orgSlug}/payroll/payslips`)}>
        <ArrowLeft className="mr-1.5 size-4" /> Back to payslips
      </Button>
      <PageHeader
        title="Email Pay Slips"
        subtitle="Mail-merge an accompanying message and attach each employee's pay slip PDF."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 1. Accompanying message */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-sm font-bold text-foreground">1. Accompanying message</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <RichTextEditor value={message} onChange={setMessage} placeholder="Message to each employee…" />
            <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              An email is sent to each selected employee with their pay slip PDF attached. Only
              employees with a valid email address receive their documents.
            </p>
          </CardContent>
        </Card>

        {/* Batch controls */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-foreground">2. Batch</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Payroll Month" required>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </Field>
            <Field label="Send Time" help="Leave empty to send immediately.">
              <Input type="datetime-local" value={sendTime} onChange={(e) => setSendTime(e.target.value)} />
            </Field>
            <PermissionGate
              permission={["hrm.payroll.manage"]}
              fallback={<p className="text-sm text-muted-foreground">You can&apos;t email pay slips.</p>}
            >
              <Button className="w-full" onClick={submit} disabled={email.isPending}>
                <Mail className="mr-1.5 size-4" />
                {email.isPending ? "Queuing…" : `Email Documents (${selectedIds.length})`}
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>
      </div>

      {/* Select employees */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Select Employees</h3>
          <SearchInput value={search} onChange={setSearch} placeholder="Search employee…" className="max-w-xs" />
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="w-10 p-3">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all" />
                </th>
                <th className="p-3 text-left font-medium">Staff No.</th>
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const id = String(e.id);
                return (
                  <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={!!selected[id]}
                        onChange={() => setSelected((s) => ({ ...s, [id]: !s[id] }))}
                        aria-label={`Select ${employeeName(e)}`}
                      />
                    </td>
                    <td className="p-3 text-muted-foreground">{e.employee_number || "—"}</td>
                    <td className="p-3 font-medium">{employeeName(e)}</td>
                    <td className="p-3 text-muted-foreground">{e.email}</td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">
                    No employees with email addresses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
