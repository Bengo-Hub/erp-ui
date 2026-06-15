"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent, CardHeader } from "@/components/ui/base";
import { Field, Input, Select } from "@/components/ui/form";
import { LoadingState } from "@/components/ui/states";
import { useEmployeeSalary, useSaveSalary } from "@/hooks/use-employees";
import { normalizeList } from "@/lib/api/drf";
import { type EmployeeSalaryDetail } from "@/lib/api/employees";

type FormValues = {
  basic_salary?: string;
  currency?: string;
  pay_frequency?: string;
  payment_method?: string;
  effective_date?: string;
};

export function SalaryTab({ employeeId }: { employeeId: number | string }) {
  const { data, isLoading } = useEmployeeSalary(employeeId);
  const save = useSaveSalary(employeeId);
  const current = normalizeList<EmployeeSalaryDetail>(data).results[0];

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (current) {
      reset({
        basic_salary: current.basic_salary != null ? String(current.basic_salary) : "",
        currency: current.currency ?? "KES",
        pay_frequency: current.pay_frequency ?? "monthly",
        payment_method: current.payment_method ?? "",
        effective_date: current.effective_date ?? "",
      });
    } else {
      reset({ currency: "KES", pay_frequency: "monthly" });
    }
  }, [current, reset]);

  const onSubmit = (v: FormValues) => {
    const payload: Partial<EmployeeSalaryDetail> = { ...v };
    Object.keys(payload).forEach((k) => {
      if ((payload as Record<string, unknown>)[k] === "") delete (payload as Record<string, unknown>)[k];
    });
    save.mutate(payload);
  };

  if (isLoading) return <LoadingState />;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <h3 className="text-sm font-bold text-foreground">Salary Details</h3>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Basic Salary">
            <Input type="number" step="0.01" {...register("basic_salary")} />
          </Field>
          <Field label="Currency">
            <Select {...register("currency")}>
              <option value="KES">KES</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </Select>
          </Field>
          <Field label="Pay Frequency">
            <Select {...register("pay_frequency")}>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="daily">Daily</option>
            </Select>
          </Field>
          <Field label="Payment Method">
            <Select {...register("payment_method")}>
              <option value="">Select…</option>
              <option value="bank">Bank Transfer</option>
              <option value="mpesa">M-Pesa</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </Select>
          </Field>
          <Field label="Effective Date">
            <Input type="date" {...register("effective_date")} />
          </Field>
        </CardContent>
      </Card>
      <PermissionGate permission={["change_salarydetails", "change_employee"]}>
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save Salary"}
          </Button>
        </div>
      </PermissionGate>
    </form>
  );
}
