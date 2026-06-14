"use client";

import { useDeductions, useDeleteDeduction, useSaveDeduction } from "@/hooks/use-payroll-settings";

import { PayComponentManager } from "../_component-manager";

export default function DeductionsPage() {
  return (
    <PayComponentManager
      tabKey="deductions"
      entityLabel="Deduction"
      hooks={{ list: useDeductions, save: useSaveDeduction, remove: useDeleteDeduction }}
    />
  );
}
