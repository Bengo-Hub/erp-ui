"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button, Card, CardContent, CardHeader } from "@/components/ui/base";
import { Field, Input, Select } from "@/components/ui/form";
import { useSaveEmployee } from "@/hooks/use-employees";
import { useDepartments, useJobGroups, useJobTitles } from "@/hooks/use-hrm-settings";
import { normalizeList } from "@/lib/api/drf";
import { type Employee } from "@/lib/api/employees";
import { EMPLOYMENT_TYPES } from "@/lib/hrm";

type FormValues = {
  first_name: string;
  middle_name?: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  national_id?: string;
  kra_pin?: string;
  gender?: string;
  date_of_birth?: string;
  employment_type?: string;
  date_joined?: string;
  job_title?: string;
  department?: string;
  job_group?: string;
  basic_salary?: string;
};

function toFormValues(e?: Employee): FormValues {
  if (!e) return { first_name: "", last_name: "" };
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
  };
}

/** Create or edit the core employee record. Sub-records (bank/kin/salary) live in the profile tabs. */
export function EmployeeForm({ orgSlug, employee }: { orgSlug: string; employee?: Employee }) {
  const router = useRouter();
  const save = useSaveEmployee();
  const { data: deptData } = useDepartments();
  const { data: titleData } = useJobTitles();
  const { data: groupData } = useJobGroups();
  const departments = normalizeList(deptData).results;
  const jobTitles = normalizeList(titleData).results;
  const jobGroups = normalizeList(groupData).results;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: toFormValues(employee) });

  const onSubmit = (v: FormValues) => {
    const payload: Partial<Employee> = {
      ...v,
      job_title: v.job_title ? Number(v.job_title) : undefined,
      department: v.department ? Number(v.department) : undefined,
      job_group: v.job_group ? Number(v.job_group) : undefined,
    };
    Object.keys(payload).forEach((k) => {
      if ((payload as Record<string, unknown>)[k] === "" || (payload as Record<string, unknown>)[k] === undefined)
        delete (payload as Record<string, unknown>)[k];
    });
    save.mutate(
      { id: employee?.id, data: payload },
      {
        onSuccess: (res) => {
          const id = (res as Employee)?.id ?? employee?.id;
          router.push(id ? `/${orgSlug}/hrm/employees/${id}` : `/${orgSlug}/hrm/employees`);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-bold text-foreground">Personal Details</h2>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="First Name" required error={errors.first_name?.message}>
            <Input {...register("first_name", { required: "First name is required" })} />
          </Field>
          <Field label="Middle Name">
            <Input {...register("middle_name")} />
          </Field>
          <Field label="Last Name" required error={errors.last_name?.message}>
            <Input {...register("last_name", { required: "Last name is required" })} />
          </Field>
          <Field label="Email">
            <Input type="email" {...register("email")} />
          </Field>
          <Field label="Phone Number">
            <Input {...register("phone_number")} />
          </Field>
          <Field label="Gender">
            <Select {...register("gender")}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Date of Birth">
            <Input type="date" {...register("date_of_birth")} />
          </Field>
          <Field label="National ID">
            <Input {...register("national_id")} />
          </Field>
          <Field label="KRA PIN">
            <Input {...register("kra_pin")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-bold text-foreground">Employment</h2>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Department">
            <Select {...register("department")}>
              <option value="">Select…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Job Title">
            <Select {...register("job_title")}>
              <option value="">Select…</option>
              {jobTitles.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Job Group">
            <Select {...register("job_group")}>
              <option value="">Select…</option>
              {jobGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Employment Type">
            <Select {...register("employment_type")}>
              <option value="">Select…</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date Joined">
            <Input type="date" {...register("date_joined")} />
          </Field>
          <Field label="Basic Salary" help="You can refine this in the Salary tab later.">
            <Input type="number" step="0.01" {...register("basic_salary")} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : employee ? "Save Changes" : "Create Employee"}
        </Button>
      </div>
    </form>
  );
}
