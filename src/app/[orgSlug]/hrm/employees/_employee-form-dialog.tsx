"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/base";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Stepper } from "@/components/ui/stepper";
import { useSaveEmployee } from "@/hooks/use-employees";
import { useDepartments, useJobGroups, useJobTitles } from "@/hooks/use-hrm-settings";
import { normalizeList } from "@/lib/api/drf";
import { type Employee } from "@/lib/api/employees";
import { EMPLOYMENT_TYPES } from "@/lib/hrm";
import {
  optionalEmail,
  optionalKraPin,
  optionalNationalId,
  optionalPastOrTodayDate,
  optionalPhone,
  optionalPositiveMoney,
} from "@/lib/validation";

const employeeSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  middle_name: z.string().trim().optional(),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: optionalEmail,
  phone_number: optionalPhone,
  national_id: optionalNationalId,
  kra_pin: optionalKraPin,
  gender: z.string().optional(),
  date_of_birth: optionalPastOrTodayDate,
  employment_type: z.string().optional(),
  date_joined: z.string().trim().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  job_group: z.string().optional(),
  basic_salary: optionalPositiveMoney,
  is_director: z.boolean().optional(),
  is_shareholder: z.boolean().optional(),
});

type FormValues = z.infer<typeof employeeSchema>;

function toFormValues(e?: Employee | null): FormValues {
  if (!e) return { first_name: "", last_name: "", is_director: false, is_shareholder: false };
  const idOf = (v: unknown) =>
    v && typeof v === "object" && "id" in v ? String((v as { id: number }).id) : v != null ? String(v) : "";
  return {
    first_name: e.first_name ?? "",
    middle_name: e.middle_name ?? "",
    last_name: e.last_name ?? "",
    email: e.email ?? "",
    phone_number: e.phone_number ?? "",
    national_id: e.national_id ?? "",
    kra_pin: e.kra_pin ?? "",
    gender: e.gender ?? "",
    date_of_birth: e.date_of_birth ?? "",
    employment_type: e.employment_type ?? "",
    date_joined: e.date_joined ?? "",
    job_title: idOf(e.job_title),
    department: idOf(e.department),
    job_group: idOf(e.job_group),
    basic_salary: e.basic_salary != null ? String(e.basic_salary) : "",
    is_director: !!e.is_director,
    is_shareholder: !!e.is_shareholder,
  };
}

/**
 * Create/Edit the core employee record in a modal (one reused form for both modes).
 * Sub-records (bank/kin/salary/education/…) live in the profile tabs. Replaces the
 * old standalone /new and /[id]/edit pages.
 */
export function EmployeeFormDialog({
  open,
  employee,
  onClose,
  onCreated,
}: {
  open: boolean;
  employee?: Employee | null;
  onClose: () => void;
  onCreated?: (id: string | number) => void;
}) {
  const isEdit = !!employee;
  const save = useSaveEmployee();
  const { data: deptData } = useDepartments();
  const { data: titleData } = useJobTitles();
  const { data: groupData } = useJobGroups();
  const departments = normalizeList(deptData).results;
  const jobTitles = normalizeList(titleData).results;
  const jobGroups = normalizeList(groupData).results;

  const [step, setStep] = useState(0);
  const { register, handleSubmit, reset, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(employeeSchema),
  });
  useEffect(() => {
    if (open) {
      reset(toFormValues(employee));
      setStep(0);
    }
  }, [open, employee, reset]);

  const next = async () => {
    const ok = await trigger(["first_name", "last_name", "email", "phone_number", "national_id", "kra_pin", "date_of_birth"]);
    if (ok) setStep(1);
  };

  const onSubmit = (v: FormValues) => {
    // Keep FK ids as their raw select value (string) — erp-api entity ids may be UUID
    // strings; never Number() them.
    const payload: Record<string, unknown> = { ...v };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "" || payload[k] === undefined) delete payload[k];
    });
    save.mutate(
      { id: employee?.id, data: payload as Partial<Employee> },
      {
        onSuccess: (res) => {
          const id = (res as Employee)?.id ?? employee?.id;
          onClose();
          if (!isEdit && id != null) onCreated?.(id);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Employee" : "Add Employee"}
      description="Core record — bank, kin, salary and other details are on the profile tabs."
      maxWidth="max-w-3xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          {step === 1 && (
            <Button variant="outline" size="sm" onClick={() => setStep(0)} disabled={save.isPending}>
              Back
            </Button>
          )}
          {step === 0 ? (
            <Button size="sm" onClick={next}>
              Next
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={save.isPending}>
              {save.isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Employee"}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <Stepper steps={["Personal", "Employment"]} current={step} />
        <div className={step === 0 ? undefined : "hidden"}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personal</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="First Name" required error={errors.first_name?.message}>
              <Input {...register("first_name")} />
            </Field>
            <Field label="Middle Name"><Input {...register("middle_name")} /></Field>
            <Field label="Last Name" required error={errors.last_name?.message}>
              <Input {...register("last_name")} />
            </Field>
            <Field label="Email" error={errors.email?.message}><Input type="email" {...register("email")} /></Field>
            <Field label="Phone Number" error={errors.phone_number?.message}><Input {...register("phone_number")} /></Field>
            <Field label="Gender">
              <Select {...register("gender")}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Date of Birth" error={errors.date_of_birth?.message}><Input type="date" {...register("date_of_birth")} /></Field>
            <Field label="National ID" error={errors.national_id?.message}><Input {...register("national_id")} /></Field>
            <Field label="KRA PIN" error={errors.kra_pin?.message}><Input {...register("kra_pin")} /></Field>
          </div>
        </div>

        <div className={step === 1 ? undefined : "hidden"}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employment</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Department">
              <Select {...register("department")}>
                <option value="">Select…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Job Title">
              <Select {...register("job_title")}>
                <option value="">Select…</option>
                {jobTitles.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </Field>
            <Field label="Job Group">
              <Select {...register("job_group")}>
                <option value="">Select…</option>
                {jobGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            </Field>
            <Field label="Employment Type">
              <Select {...register("employment_type")}>
                <option value="">Select…</option>
                {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Date Joined"><Input type="date" {...register("date_joined")} /></Field>
            <Field label="Basic Salary" help="Refine in the Salary tab later." error={errors.basic_salary?.message}>
              <Input type="number" step="0.01" {...register("basic_salary")} />
            </Field>
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:gap-8">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="size-4 rounded border-input accent-primary"
                {...register("is_director")}
              />
              Director
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="size-4 rounded border-input accent-primary"
                {...register("is_shareholder")}
              />
              Shareholder
            </label>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
