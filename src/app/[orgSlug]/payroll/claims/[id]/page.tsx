"use client";

import { ArrowLeft, CheckCircle2, Paperclip, Save, Upload } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailSkeleton, ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import {
  useApproveClaim,
  useClaim,
  useClaimItems,
  useMileageRoutes,
  useSaveClaim,
  useUploadClaimAttachment,
} from "@/hooks/use-payroll";
import { type Claim } from "@/lib/api/payroll";
import { formatMoney } from "@/lib/utils";

import { ClaimHeaderForm, emptyHeader, type ClaimHeaderValues } from "../_claim-header-form";
import { ClaimItemsTable, MileageTable, PerDiemEditor } from "../_detail-tables";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  const id = (params?.id as string) ?? "";

  const { data: claim, isLoading, error, refetch } = useClaim(id);
  const save = useSaveClaim();
  const approve = useApproveClaim();
  const upload = useUploadClaimAttachment(id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);

  const [values, setValues] = useState<ClaimHeaderValues>(emptyHeader());
  const [perDiem, setPerDiem] = useState({ days: "", rate: "" });

  // Hydrate the editable header once the claim loads.
  useEffect(() => {
    if (!claim) return;
    setValues({
      employee: String(claim.employee_id ?? claim.employee ?? ""),
      claim_type: claim.claim_type ?? "reimbursement",
      category: claim.category ?? "",
      date: claim.date ?? "",
      project_id: claim.project_id ?? "",
      cost_center_id: claim.cost_center_id ?? "",
      taxable: !!claim.taxable,
      description: claim.description ?? "",
      amount: String(claim.amount ?? ""),
    });
  }, [claim]);

  // Live detail totals (for itemised / mileage types the header amount mirrors these).
  const isItemised = values.claim_type === "reimbursement" || values.claim_type === "other";
  const isMileage = values.claim_type === "mileage";
  const isPerDiem = values.claim_type === "per_diem";

  const { data: items = [] } = useClaimItems(isItemised ? id : undefined);
  const { data: routes = [] } = useMileageRoutes(isMileage ? id : undefined);

  const computedTotal = useMemo(() => {
    if (isItemised) return items.reduce((s, it) => s + num(it.amount), 0);
    if (isMileage) return routes.reduce((s, r) => s + num(r.amount), 0);
    if (isPerDiem) return num(perDiem.days) * num(perDiem.rate);
    return num(values.amount);
  }, [isItemised, isMileage, isPerDiem, items, routes, perDiem, values.amount]);

  const setField = <K extends keyof ClaimHeaderValues>(name: K, value: ClaimHeaderValues[K]) =>
    setValues((v) => ({ ...v, [name]: value }));

  const approved = !!claim?.approved;

  const saveHeader = () => {
    const data: Partial<Claim> = {
      employee_id: values.employee || undefined,
      claim_type: values.claim_type,
      category: values.category || values.claim_type,
      date: values.date || undefined,
      project_id: values.project_id || undefined,
      cost_center_id: values.cost_center_id || undefined,
      taxable: values.taxable,
      description: values.description || undefined,
      amount: String(computedTotal),
    };
    save.mutate({ id, data });
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push(`/${orgSlug}/payroll/claims`)}>
        <ArrowLeft className="mr-1.5 size-4" /> Back to claims
      </Button>

      {isLoading ? (
        <DetailSkeleton />
      ) : error || !claim ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <PageHeader
            title="Expense Claim"
            subtitle={claim.employee_name || claim.employee_id || ""}
            actions={
              <div className="flex items-center gap-2">
                <Badge variant={approved ? "success" : "warning"}>
                  {claim.status || (approved ? "Approved" : "Pending")}
                </Badge>
                {!approved && (
                  <Button size="sm" variant="outline" onClick={() => setConfirmApprove(true)}>
                    <CheckCircle2 className="mr-1.5 size-4" /> Approve
                  </Button>
                )}
              </div>
            }
          />

          <Card className="p-4 sm:p-6">
            <h3 className="mb-4 text-sm font-bold text-foreground">Claim Details</h3>
            <ClaimHeaderForm
              values={{ ...values, amount: String(computedTotal) }}
              setField={setField}
              lockType={approved}
              amountSlot={
                <div className="flex h-10 items-center rounded-lg border border-input bg-muted px-3 text-sm font-semibold">
                  {formatMoney(computedTotal)}
                </div>
              }
            />
          </Card>

          {/* Conditional detail tables driven by claim_type. */}
          {isItemised && (
            <Card className="p-4 sm:p-6">
              <h3 className="mb-3 text-sm font-bold text-foreground">Expense Lines</h3>
              <ClaimItemsTable claimId={id} />
            </Card>
          )}
          {isMileage && (
            <Card className="p-4 sm:p-6">
              <h3 className="mb-3 text-sm font-bold text-foreground">Mileage Routes</h3>
              <MileageTable claimId={id} />
            </Card>
          )}
          {isPerDiem && (
            <Card className="p-4 sm:p-6">
              <h3 className="mb-3 text-sm font-bold text-foreground">Per-Diem</h3>
              <PerDiemEditor
                days={perDiem.days}
                rate={perDiem.rate}
                onChange={({ days, rate }) => setPerDiem({ days, rate })}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Save the claim to record the per-diem total.
              </p>
            </Card>
          )}

          {/* Attachment */}
          <Card className="p-4 sm:p-6">
            <h3 className="mb-3 text-sm font-bold text-foreground">Attachment</h3>
            <div className="flex flex-wrap items-center gap-3">
              <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={upload.isPending}
              >
                <Upload className="mr-1.5 size-4" /> {upload.isPending ? "Uploading…" : "Upload receipt"}
              </Button>
              {claim.attachment_url && (
                <a
                  href={claim.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Paperclip className="size-4" /> View current attachment
                </a>
              )}
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/${orgSlug}/payroll/claims`)}>
              Done
            </Button>
            <Button size="sm" onClick={saveHeader} disabled={save.isPending || approved}>
              <Save className="mr-1.5 size-4" /> {save.isPending ? "Saving…" : "Save claim"}
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmApprove}
        title="Approve this claim?"
        description="Approving posts the reimbursement to finance and locks the claim from further edits."
        confirmLabel="Approve"
        loading={approve.isPending}
        onCancel={() => setConfirmApprove(false)}
        onConfirm={() => approve.mutate(id, { onSuccess: () => setConfirmApprove(false) })}
      />
    </div>
  );
}
