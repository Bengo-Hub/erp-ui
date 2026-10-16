"use client";

import { Banknote, Calculator, Send } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PermissionGate } from "@/components/auth/permission-gate";
import { OutletFilter } from "@/components/outlet/outlet-filter";
import { SubscriptionGate } from "@/components/subscription/subscription-gate";
import { Button, Card, CardContent, CardHeader } from "@/components/ui/base";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Stepper } from "@/components/ui/stepper";
import { useDepartmentOptions, useProjectOptions } from "@/hooks/use-option-hooks";
import {
  activeRunFromError,
  useDisbursePayroll,
  usePayrollPreview,
  usePayrollRunProgress,
  useProcessPayroll,
} from "@/hooks/use-payroll";
import { type PayrollPreviewRow, type PayrollProcessPayload, type PayrollRunJob } from "@/lib/api/payroll";
import { EMPLOYMENT_TYPES } from "@/lib/hrm";
import { useOutletFilterStore } from "@/store/outlet-filter";

import { PreviewTable } from "./_preview-table";

const STEPS = ["Period", "Preview", "Run", "Disburse"];

/** A background run's live state: a progress bar while it works, the reason if it failed. */
function RunProgress({ run }: { run: PayrollRunJob | null }) {
  if (!run || run.status === "queued") {
    return <p className="text-sm text-muted-foreground">Starting the payroll run…</p>;
  }
  if (run.status === "failed") {
    return (
      <div className="max-w-md">
        <h3 className="text-base font-bold text-destructive">The payroll run did not finish</h3>
        <p className="mt-1 text-sm text-muted-foreground">{run.error || "Unknown error"}</p>
      </div>
    );
  }
  return (
    <div className="w-full max-w-md space-y-2">
      <h3 className="text-base font-bold text-foreground">
        {run.status === "completed" ? "Payroll run complete" : "Running payroll…"}
      </h3>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={run.percent}
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${run.percent}%` }} />
      </div>
      <p className="text-sm text-muted-foreground">
        {run.total ? `${run.done} of ${run.total} employees (${run.percent}%)` : "Selecting employees…"}
      </p>
    </div>
  );
}

function unwrapPreview(res: unknown): PayrollPreviewRow[] {
  if (Array.isArray(res)) return res as PayrollPreviewRow[];
  const r = res as { results?: PayrollPreviewRow[]; data?: PayrollPreviewRow[] };
  return r?.results ?? r?.data ?? [];
}

export default function ProcessPayrollPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const selectedOutlet = useOutletFilterStore((s) => s.selectedOutlet);

  const [step, setStep] = useState(0);
  const [employmentType, setEmploymentType] = useState("permanent");
  const [departmentId, setDepartmentId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const departments = useDepartmentOptions();
  const projects = useProjectOptions();
  const [preview, setPreview] = useState<PayrollPreviewRow[]>([]);
  const [confirmRun, setConfirmRun] = useState(false);
  const [confirmDisburse, setConfirmDisburse] = useState(false);

  const previewMut = usePayrollPreview();
  const processMut = useProcessPayroll();
  const disburseMut = useDisbursePayroll();

  const payload: PayrollProcessPayload = useMemo(
    () => ({
      employment_type: employmentType,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      payment_period: fromDate && toDate ? `${fromDate} – ${toDate}` : undefined,
      outlet_id: selectedOutlet?.id || undefined,
      department_id: departmentId || undefined,
      project_id: projectId || undefined,
    }),
    [employmentType, fromDate, toDate, selectedOutlet, departmentId, projectId],
  );

  const runPreview = () => {
    if (!fromDate || !toDate) {
      toast.error("Select a pay period first");
      return;
    }
    previewMut.mutate(payload, {
      onSuccess: (res) => {
        setPreview(unwrapPreview(res));
        setStep(1);
      },
    });
  };

  // The run happens in the background; its progress streams live and the wizard moves on to
  // disbursement once it completes.
  const [runId, setRunId] = useState<string | null>(null);
  const { run, streamError } = usePayrollRunProgress(runId);
  useEffect(() => {
    if (run?.status === "completed") setStep(3);
  }, [run?.status]);

  const runPayroll = () =>
    processMut.mutate(payload, {
      onSuccess: (res) => {
        setConfirmRun(false);
        const id = res.job?.id ?? res.task_id;
        // An older API answered synchronously with no job: the run is already done.
        if (id && res.job) setRunId(id);
        else setStep(3);
      },
      onError: (e) => {
        setConfirmRun(false);
        const active = activeRunFromError(e);
        if (active) setRunId(active);
      },
    });

  const disburse = () =>
    disburseMut.mutate(
      { payment_period: payload.payment_period, from_date: fromDate, to_date: toDate },
      { onSuccess: () => setConfirmDisburse(false) },
    );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Process Payroll"
        subtitle="Select a period, preview computations, run, then disburse"
        actions={<OutletFilter tenantSlug={orgSlug} />}
      />

      <Card>
        <CardContent>
          <Stepper steps={STEPS} current={step} />
        </CardContent>
      </Card>

      <SubscriptionGate feature="payroll">
      {step === 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-foreground">Pay Period</h3>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="Employment Type">
              <Select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Department">
              <Combobox
                value={departmentId}
                onChange={setDepartmentId}
                options={departments.options}
                loading={departments.isLoading}
                placeholder="All departments"
              />
            </Field>
            <Field label="Project">
              <Combobox
                value={projectId}
                onChange={setProjectId}
                options={projects.options}
                loading={projects.isLoading}
                placeholder="All projects"
              />
            </Field>
            <Field label="From Date" required>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </Field>
            <Field label="To Date" required>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </Field>
            <div className="flex justify-end sm:col-span-3">
              <PermissionGate
                permission={["hrm.payroll.process"]}
                fallback={<p className="text-sm text-muted-foreground">You can&apos;t run payroll.</p>}
              >
                <Button onClick={runPreview} disabled={previewMut.isPending}>
                  <Calculator className="mr-1.5 size-4" />
                  {previewMut.isPending ? "Computing…" : "Preview Payroll"}
                </Button>
              </PermissionGate>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <>
          <PreviewTable rows={preview} isLoading={previewMut.isPending} error={previewMut.error} />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button onClick={() => setStep(2)} disabled={preview.length === 0}>
              Continue to Run
            </Button>
          </div>
        </>
      )}

      {step === 2 && runId && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <RunProgress run={run} />
            {streamError && <p className="text-xs text-muted-foreground">{streamError}</p>}
            {run?.status === "failed" && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRunId(null)}>
                  Back
                </Button>
                <PermissionGate permission={["hrm.payroll.process"]}>
                  <Button onClick={() => setConfirmRun(true)} disabled={processMut.isPending}>
                    Run Again
                  </Button>
                </PermissionGate>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && !runId && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Banknote className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Ready to run payroll</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                This will generate payslips for {preview.length} employee(s) for the period {fromDate}{" "}
                to {toDate}. Review the preview before running.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back to Preview
              </Button>
              <PermissionGate permission={["hrm.payroll.process"]}>
                <Button onClick={() => setConfirmRun(true)} disabled={processMut.isPending}>
                  Run Payroll
                </Button>
              </PermissionGate>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
              <Send className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Payroll processed</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {run?.payslips ? `${run.payslips} payslip(s) have been generated. ` : "Payslips have been generated. "}
                You can now disburse net pay to employees.
              </p>
            </div>
            <PermissionGate
              permission={["hrm.payroll.disburse"]}
              fallback={<p className="text-sm text-muted-foreground">You can&apos;t disburse payroll.</p>}
            >
              <Button onClick={() => setConfirmDisburse(true)} disabled={disburseMut.isPending}>
                <Send className="mr-1.5 size-4" /> Disburse Payroll
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>
      )}
      </SubscriptionGate>

      <ConfirmDialog
        open={confirmRun}
        title="Run payroll for this period?"
        description={`Payslips will be generated for ${preview.length} employee(s). This is a significant action.`}
        confirmLabel="Run Payroll"
        loading={processMut.isPending}
        onCancel={() => setConfirmRun(false)}
        onConfirm={runPayroll}
      />
      <ConfirmDialog
        open={confirmDisburse}
        title="Disburse net pay?"
        description="This will mark the payroll as disbursed and trigger payments. This cannot be undone."
        confirmLabel="Disburse"
        destructive
        loading={disburseMut.isPending}
        onCancel={() => setConfirmDisburse(false)}
        onConfirm={disburse}
      />
    </div>
  );
}
