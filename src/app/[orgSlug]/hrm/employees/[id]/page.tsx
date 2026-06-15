"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { DetailSkeleton, ErrorState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useEmployee } from "@/hooks/use-employees";
import { employeeName } from "@/lib/hrm";

import { BankTab } from "./_bank-tab";
import { KinTab } from "./_kin-tab";
import { OverviewTab } from "./_overview-tab";
import { SalaryTab } from "./_salary-tab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "salary", label: "Salary" },
  { key: "bank", label: "Bank" },
  { key: "kin", label: "Next of Kin" },
];

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  // Employee ids are UUID strings in erp-api — keep as-is (do not Number()).
  const id = params?.id as string;
  const [tab, setTab] = useState("overview");

  const { data: employee, isLoading, error, refetch } = useEmployee(id);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push(`/${orgSlug}/hrm/employees`)}>
        <ArrowLeft className="mr-1.5 size-4" /> Back to employees
      </Button>

      {isLoading ? (
        <DetailSkeleton />
      ) : error || !employee ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <PageHeader
            title={
              <span className="flex items-center gap-2">
                {employeeName(employee)}
                {employee.employee_number && (
                  <Badge variant="outline">{employee.employee_number}</Badge>
                )}
              </span>
            }
            subtitle={employee.email}
            actions={
              <PermissionGate permission="change_employee">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/${orgSlug}/hrm/employees/${id}/edit`)}
                >
                  <Pencil className="mr-1.5 size-4" /> Edit
                </Button>
              </PermissionGate>
            }
          />

          <Tabs tabs={TABS} active={tab} onChange={setTab} />

          {tab === "overview" && <OverviewTab employee={employee} />}
          {tab === "salary" && <SalaryTab employeeId={id} />}
          {tab === "bank" && <BankTab employeeId={id} />}
          {tab === "kin" && <KinTab employeeId={id} />}
        </>
      )}
    </div>
  );
}
