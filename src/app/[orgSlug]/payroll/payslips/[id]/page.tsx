"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { DetailSkeleton, ErrorState } from "@/components/ui/states";
import { usePayslip } from "@/hooks/use-payroll";

import { PayslipView } from "./_payslip-view";

export default function PayslipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  const id = Number(params?.id);

  const { data: payslip, isLoading, error, refetch } = usePayslip(id);

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
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-1.5 size-4" /> Print / PDF
                </Button>
              }
            />
          </div>
          <PayslipView payslip={payslip} />
        </>
      )}
    </div>
  );
}
