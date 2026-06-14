"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useEmployee } from "@/hooks/use-employees";
import { employeeName } from "@/lib/hrm";

import { EmployeeForm } from "../../_employee-form";

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  const id = Number(params?.id);
  const { data: employee, isLoading, error, refetch } = useEmployee(id);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push(`/${orgSlug}/hrm/employees/${id}`)}>
        <ArrowLeft className="mr-1.5 size-4" /> Back to profile
      </Button>
      {isLoading ? (
        <LoadingState />
      ) : error || !employee ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <PageHeader title={`Edit ${employeeName(employee)}`} subtitle="Update core employee details" />
          <PermissionGate
            permission="change_employee"
            fallback={<EmptyState title="Access denied" description="You can't edit employees." />}
          >
            <EmployeeForm orgSlug={orgSlug} employee={employee} />
          </PermissionGate>
        </>
      )}
    </div>
  );
}
