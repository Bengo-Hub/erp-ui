"use client";

import { PdfPreview, useDocumentPreview } from "@bengo-hub/shared-ui-lib/documents";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { DetailSkeleton, ErrorState } from "@/components/ui/states";
import { usePayslip } from "@/hooks/use-payroll";
import { payrollApi } from "@/lib/api/payroll";

import { PayslipView } from "./_payslip-view";

export default function PayslipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  // Payslip ids are UUIDs — use the raw route param (Number() would NaN a UUID).
  const id = (params?.id as string) ?? "";

  const { data: payslip, isLoading, error, refetch } = usePayslip(id);
  // Shared "preview-first" flow: opens the server PDF in a modal with Download / Print / Open-in-tab.
  const { openPreview, previewProps } = useDocumentPreview();

  function previewPdf() {
    if (!id) return;
    openPreview(() => payrollApi.payslipPdf(id).then((r) => r.blob), {
      fileName: `payslip_${id}.pdf`,
      title: payslip?.employee_name ? `Payslip — ${payslip.employee_name}` : "Payslip",
    });
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 print:p-0">
      <div className="print:hidden">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/${orgSlug}/payroll/payslips`)}>
          <ArrowLeft className="mr-1.5 size-4" /> Back to payslips
        </Button>
      </div>

      {isLoading ? (
        <DetailSkeleton />
      ) : error || !payslip ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <div className="print:hidden">
            <PageHeader
              title="Payslip"
              subtitle={payslip.employee_name}
              actions={
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={previewPdf}>
                    <FileText className="mr-1.5 size-4" /> Preview PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="mr-1.5 size-4" /> Print
                  </Button>
                </div>
              }
            />
          </div>
          <PayslipView payslip={payslip} />
        </>
      )}

      <PdfPreview {...previewProps} />
    </div>
  );
}
