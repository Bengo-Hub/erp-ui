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
  income_tax?: string;
  // KRA relief inputs (monthly actual amounts; the payroll engine applies the statutory caps).
  insurance_premium?: string;
  pension_contribution?: string;
  mortgage_interest?: string;
  disability_exempt?: boolean;
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
        income_tax: (current.income_tax as string) ?? "primary",
        insurance_premium: current.insurance_premium != null ? String(current.insurance_premium) : "",
        pension_contribution: current.pension_contribution != null ? String(current.pension_contribution) : "",
        mortgage_interest: current.mortgage_interest != null ? String(current.mortgage_interest) : "",
        disability_exempt: Boolean(current.disability_exempt),
      });
    } else {
      reset({ currency: "KES", pay_frequency: "monthly", income_tax: "primary" });
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
          <Field
            label="PAYE Category"
            help="Secondary = taxed at the top rate with no personal relief (second employer)."
          >
            <Select {...register("income_tax")}>
              <option value="primary">Primary employment</option>
              <option value="secondary">Secondary employment</option>
              <option value="none">Tax exempt</option>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <h3 className="text-sm font-bold text-foreground">KRA Tax Reliefs</h3>
          <p className="text-xs text-muted-foreground">
            Monthly actual amounts. The payroll engine applies the statutory caps automatically
            (insurance 15% up to 5,000; pension &amp; mortgage up to 30,000; PWD exemption 150,000).
            Leave at 0 if not applicable. Not applied to secondary employees.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Insurance Premium (monthly)" help="Life / health / education premiums → 15% relief, cap 5,000/mo.">
            <Input type="number" step="0.01" min="0" {...register("insurance_premium")} />
          </Field>
          <Field label="Pension Contribution (monthly)" help="Registered scheme → deductible pre-tax, cap 30,000/mo.">
            <Input type="number" step="0.01" min="0" {...register("pension_contribution")} />
          </Field>
          <Field label="Mortgage Interest (monthly)" help="Owner-occupier interest → deductible pre-tax, cap 30,000/mo.">
            <Input type="number" step="0.01" min="0" {...register("mortgage_interest")} />
          </Field>
          <Field label="Disability Exemption" help="Holds a PWD tax-exemption certificate (first 150,000/mo exempt).">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("disability_exempt")} />
              PWD certificate holder
            </label>
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
