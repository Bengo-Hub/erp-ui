import type { ReactNode } from "react";

import { SubscriptionGate } from "@/components/subscription/subscription-gate";

/**
 * Route-level subscription gate for the appraisals module (ERP tier 3 per the use-case
 * PowerSuite matrix). Every /hrm/appraisals/* page renders behind the "appraisals"
 * feature — block-mode upgrade CTA when the tenant's plan lacks it.
 */
export default function AppraisalsGateLayout({ children }: { children: ReactNode }) {
  return <SubscriptionGate feature="appraisals">{children}</SubscriptionGate>;
}
