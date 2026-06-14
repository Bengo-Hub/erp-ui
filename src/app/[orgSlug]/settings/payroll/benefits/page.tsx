"use client";

import { useBenefits, useDeleteBenefit, useSaveBenefit } from "@/hooks/use-payroll-settings";

import { PayComponentManager } from "../_component-manager";

export default function BenefitsPage() {
  return (
    <PayComponentManager
      tabKey="benefits"
      entityLabel="Benefit"
      hooks={{ list: useBenefits, save: useSaveBenefit, remove: useDeleteBenefit }}
    />
  );
}
