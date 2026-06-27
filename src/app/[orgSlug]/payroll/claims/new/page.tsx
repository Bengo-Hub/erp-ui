"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Card } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { useSaveClaim } from "@/hooks/use-payroll";
import { type Claim } from "@/lib/api/payroll";

import { ClaimHeaderForm, emptyHeader, type ClaimHeaderValues } from "../_claim-header-form";

export default function NewClaimPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  const save = useSaveClaim();
  const [values, setValues] = useState<ClaimHeaderValues>(emptyHeader());

  const setField = <K extends keyof ClaimHeaderValues>(name: K, value: ClaimHeaderValues[K]) =>
    setValues((v) => ({ ...v, [name]: value }));

  const submit = () => {
    if (!values.employee) return;
    const data: Partial<Claim> = {
      employee_id: values.employee,
      claim_type: values.claim_type,
      category: values.category || values.claim_type,
      date: values.date || undefined,
      project_id: values.project_id || undefined,
      cost_center_id: values.cost_center_id || undefined,
      taxable: values.taxable,
      description: values.description || undefined,
      // Itemised + mileage totals come from the detail tables; seed at 0.
      amount: "0",
    };
    save.mutate({ data }, {
      onSuccess: (created) => {
        const id = (created as Claim)?.id;
        // Continue to the detail page so lines / routes / per-diem + attachment can be added.
        router.push(`/${orgSlug}/payroll/claims/${id ?? ""}`);
      },
    });
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push(`/${orgSlug}/payroll/claims`)}>
        <ArrowLeft className="mr-1.5 size-4" /> Back to claims
      </Button>

      <PageHeader
        title="Submit Expense Claim"
        subtitle="Create the claim, then add line items, mileage routes or per-diem and attach receipts."
      />

      <Card className="p-4 sm:p-6">
        <ClaimHeaderForm values={values} setField={setField} />
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" onClick={() => router.push(`/${orgSlug}/payroll/claims`)}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={save.isPending || !values.employee}>
            {save.isPending ? "Creating…" : "Create & add details"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
