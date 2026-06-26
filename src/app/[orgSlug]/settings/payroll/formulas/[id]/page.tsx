"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button, Card, CardContent, CardHeader } from "@/components/ui/base";
import { Field, Input, Select } from "@/components/ui/form";
import { LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { useFormula, useSaveFormulaDetail } from "@/hooks/use-payroll-settings";
import { type Formula, type FormulaItem } from "@/lib/api/payroll-settings";

// Each "kind" maps to the (type, category) pair the payroll engine resolves (config_builder).
const KINDS = [
  { value: "income:primary", label: "PAYE — Primary employee" },
  { value: "income:secondary", label: "PAYE — Secondary employee" },
  { value: "deduction:social_security_fund", label: "N.S.S.F." },
  { value: "deduction:shif", label: "S.H.I.F." },
  { value: "deduction:nhif", label: "N.H.I.F. (legacy)" },
  { value: "deduction:housing_levy", label: "Affordable Housing Levy" },
  { value: "deduction:nita", label: "N.I.T.A." },
];

type BandRow = {
  amount_from?: string;
  amount_to?: string;
  deduct_amount?: string;
  deduct_percentage?: string;
};

type FormValues = {
  kind: string;
  title: string;
  effective_from?: string;
  effective_to?: string;
  is_current: boolean;
  progressive: boolean;
  personal_relief?: string;
  regulatory_source?: string;
  employee_percentage?: string;
  employer_percentage?: string;
  items: BandRow[];
};

const EMPTY_BAND: BandRow = { amount_from: "", amount_to: "", deduct_amount: "", deduct_percentage: "" };

export default function FormulaEditorPage() {
  const params = useParams<{ orgSlug: string; id: string }>();
  const router = useRouter();
  const id = params.id;
  const isNew = id === "new";

  const { data, isLoading } = useFormula(isNew ? null : id);
  const save = useSaveFormulaDetail();

  const { register, control, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: { kind: "income:primary", is_current: true, progressive: true, items: [EMPTY_BAND] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (data) {
      const f = data as Formula;
      reset({
        kind: `${f.type ?? "income"}:${f.category ?? "primary"}`,
        title: f.title ?? f.name ?? "",
        effective_from: f.effective_from ?? f.effective_date ?? "",
        effective_to: f.effective_to ?? "",
        is_current: f.is_current ?? false,
        progressive: f.progressive ?? false,
        personal_relief: f.personal_relief ?? "",
        regulatory_source: f.regulatory_source ?? "",
        employee_percentage: f.employee_percentage ?? "",
        employer_percentage: f.employer_percentage ?? "",
        items:
          (f.items as FormulaItem[] | undefined)?.map((it) => ({
            amount_from: it.amount_from ?? "",
            amount_to: it.amount_to ?? "",
            deduct_amount: it.deduct_amount ?? "",
            deduct_percentage: it.deduct_percentage ?? "",
          })) ?? [EMPTY_BAND],
      });
    }
  }, [data, reset]);

  const kind = watch("kind");
  const isIncome = kind.startsWith("income:");

  const onSubmit = (v: FormValues) => {
    const [type, category] = v.kind.split(":");
    const payload: Partial<Formula> = {
      type,
      category,
      title: v.title,
      effective_from: v.effective_from || undefined,
      effective_to: v.effective_to || undefined,
      is_current: v.is_current,
      progressive: v.progressive,
      personal_relief: isIncome ? v.personal_relief || "0" : "0",
      regulatory_source: v.regulatory_source || undefined,
      items: v.items
        .filter((b) => b.amount_from !== "" || b.deduct_percentage !== "" || b.deduct_amount !== "")
        .map((b) => ({
          amount_from: b.amount_from || "0",
          amount_to: b.amount_to || "0",
          deduct_amount: b.deduct_amount || "0",
          deduct_percentage: b.deduct_percentage || "0",
        })),
      // Split is only meaningful for matched contributions (NSSF/Housing); harmless otherwise.
      employee_percentage: v.employee_percentage || undefined,
      employer_percentage: v.employer_percentage || undefined,
    };
    save.mutate(
      { id: isNew ? undefined : id, data: payload },
      { onSuccess: () => router.push(`/${params.orgSlug}/settings/payroll/formulas`) },
    );
  };

  if (!isNew && isLoading) return <LoadingState />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title={isNew ? "New Formula" : "Edit Formula"}
        subtitle="PAYE bands / statutory tiers, personal relief, effective dating and employee/employer split"
      />

      <Card>
        <CardHeader>
          <h3 className="text-sm font-bold text-foreground">Details</h3>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Statutory Type" required>
            <Select {...register("kind")} disabled={!isNew}>
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Title" required className="sm:col-span-2">
            <Input {...register("title")} placeholder="e.g. P.A.Y.E. (Finance Act 2023)" />
          </Field>
          <Field label="Effective From">
            <Input type="date" {...register("effective_from")} />
          </Field>
          <Field label="Effective To" help="Leave blank for open-ended.">
            <Input type="date" {...register("effective_to")} />
          </Field>
          {isIncome && (
            <Field label="Monthly Personal Relief">
              <Input type="number" step="0.01" {...register("personal_relief")} placeholder="2400.00" />
            </Field>
          )}
          <Field label="Regulatory Source">
            <Input {...register("regulatory_source")} placeholder="e.g. Finance Act 2023" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" {...register("is_current")} className="size-4" />
            Set as current (active)
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" {...register("progressive")} className="size-4" />
            Apply progressively
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Bands / Tiers</h3>
            <p className="text-xs text-muted-foreground">
              Use amount-to 0 for an open-ended top band. Percentage is e.g. 30 for 30%.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => append(EMPTY_BAND)}>
            <Plus className="mr-1 size-4" /> Add band
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="hidden gap-2 px-1 text-xs font-semibold text-muted-foreground sm:grid sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <span>From (KES)</span>
            <span>To (KES)</span>
            <span>Deduct Amount</span>
            <span>OR Deduct %</span>
            <span />
          </div>
          {fields.map((field, i) => (
            <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <Input type="number" step="0.01" placeholder="0" {...register(`items.${i}.amount_from`)} />
              <Input type="number" step="0.01" placeholder="0 = ∞" {...register(`items.${i}.amount_to`)} />
              <Input type="number" step="0.01" placeholder="0" {...register(`items.${i}.deduct_amount`)} />
              <Input type="number" step="0.01" placeholder="0" {...register(`items.${i}.deduct_percentage`)} />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => remove(i)}
                disabled={fields.length === 1}
                aria-label="Remove band"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-bold text-foreground">Employee / Employer Split</h3>
          <p className="text-xs text-muted-foreground">
            For matched contributions (NSSF, Housing Levy). Leave blank to use the statutory default.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Employee %">
            <Input type="number" step="0.01" {...register("employee_percentage")} placeholder="100" />
          </Field>
          <Field label="Employer %">
            <Input type="number" step="0.01" {...register("employer_percentage")} placeholder="0" />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <PermissionGate
          permission={["hrm.payroll.manage", "change_payrollcomponents"]}
          fallback={<p className="text-sm text-muted-foreground">You can&apos;t edit formulas.</p>}
        >
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save Formula"}
          </Button>
        </PermissionGate>
      </div>
    </form>
  );
}
