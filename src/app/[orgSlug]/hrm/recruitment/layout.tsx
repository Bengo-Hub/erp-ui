import type { ReactNode } from "react";

import { SubscriptionGate } from "@/components/subscription/subscription-gate";

/**
 * Route-level subscription gate for the recruitment module (ERP tier 3 per the use-case
 * PowerSuite matrix). Every /hrm/recruitment/* page renders behind the "recruitment"
 * feature — block-mode upgrade CTA when the tenant's plan lacks it.
 */
export default function RecruitmentGateLayout({ children }: { children: ReactNode }) {
  return <SubscriptionGate feature="recruitment">{children}</SubscriptionGate>;
}
