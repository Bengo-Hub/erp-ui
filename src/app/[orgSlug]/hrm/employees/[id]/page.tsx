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

import { EmployeeFormDialog } from "../_employee-form-dialog";
import { GovernanceBadges } from "../_governance-badges";
import { BankTab } from "./_bank-tab";
import { ContractTab } from "./_contract-tab";
import { DisciplinaryTab } from "./_disciplinary-tab";
import { DocumentsTab } from "./_documents-tab";
import { EducationTab } from "./_education-tab";
import { EmploymentTab } from "./_employment-tab";
import { KinTab } from "./_kin-tab";
import { OverviewTab } from "./_overview-tab";
import { SalaryTab } from "./_salary-tab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "salary", label: "Salary" },
  { key: "bank", label: "Bank" },
  { key: "kin", label: "Next of Kin" },
  { key: "education", label: "Education" },
  { key: "employment", label: "Employment" },
  { key: "disciplinary", label: "Disciplinary" },
  { key: "documents", label: "Documents" },
  { key: "contract", label: "Contract" },
];

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  // Employee ids are UUID strings in erp-api — keep as-is (do not Number()).
  const id = params?.id as string;
  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);

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
                <GovernanceBadges employee={employee} />
              </span>
            }
            subtitle={employee.email}
            actions={
              <PermissionGate permission="change_employee">
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
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
          {tab === "education" && <EducationTab employeeId={id} />}
          {tab === "employment" && <EmploymentTab employeeId={id} />}
          {tab === "disciplinary" && <DisciplinaryTab employeeId={id} />}
          {tab === "documents" && <DocumentsTab employeeId={id} />}
          {tab === "contract" && (
            <ContractTab employeeId={id} employmentType={employee.employment_type} />
          )}

          <EmployeeFormDialog open={editOpen} employee={employee} onClose={() => setEditOpen(false)} />
        </>
      )}
    </div>
  );
}
