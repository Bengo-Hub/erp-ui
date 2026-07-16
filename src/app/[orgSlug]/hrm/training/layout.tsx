import type { ReactNode } from "react";

import { SubscriptionGate } from "@/components/subscription/subscription-gate";

/**
 * Route-level subscription gate for the training module (ERP tier 3 per the use-case
 * PowerSuite matrix). Every /hrm/training/* page renders behind the "training" feature
 * — block-mode upgrade CTA when the tenant's plan lacks it.
 */
export default function TrainingGateLayout({ children }: { children: ReactNode }) {
  return <SubscriptionGate feature="training">{children}</SubscriptionGate>;
}
