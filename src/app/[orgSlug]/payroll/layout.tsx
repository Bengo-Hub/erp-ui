import type { ReactNode } from "react";

import { SubscriptionGate } from "@/components/subscription/subscription-gate";

/**
 * Route-level subscription gate for the payroll module (ERP tier 3 per the use-case
 * PowerSuite matrix). Every /payroll/* page renders behind the "payroll" feature:
 * unlocked plans see the page unchanged; locked plans get the block-mode upgrade CTA.
 */
export default function PayrollGateLayout({ children }: { children: ReactNode }) {
  return <SubscriptionGate feature="payroll">{children}</SubscriptionGate>;
}
