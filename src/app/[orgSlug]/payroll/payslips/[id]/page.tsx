"use client";

import { ArrowLeft, Download, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

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
  const [downloading, setDownloading] = useState(false);

  const { data: payslip, isLoading, error, refetch } = usePayslip(id);

  async function downloadPdf() {
    if (!id) return;
    setDownloading(true);
    try {
      const { blob, fileName } = await payrollApi.payslipPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Server enforces self-or-manager; fall back to the browser print path below.
      window.print();
    } finally {
      setDownloading(false);
    }
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
                  <Button variant="primary" size="sm" onClick={downloadPdf} disabled={downloading}>
                    <Download className="mr-1.5 size-4" /> {downloading ? "Preparing…" : "Download PDF"}
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
    </div>
  );
}
