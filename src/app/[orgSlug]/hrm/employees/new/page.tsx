"use client";

import { useParams } from "next/navigation";

import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";

import { EmployeeForm } from "../_employee-form";

export default function NewEmployeePage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Add Employee" subtitle="Create a new staff record" />
      <PermissionGate
        permission="add_employee"
        fallback={<EmptyState title="Access denied" description="You don't have permission to add employees." />}
      >
        <EmployeeForm orgSlug={orgSlug} />
      </PermissionGate>
    </div>
  );
}
