import type { ReactNode } from "react";

import { SubscriptionGate } from "@/components/subscription/subscription-gate";

/**
 * Route-level subscription gate for performance reviews/metrics/targets — these pages
 * belong to the Appraisals module in the nav, so they share the "appraisals" feature
 * code (ERP tier 3 per the use-case PowerSuite matrix).
 */
export default function PerformanceGateLayout({ children }: { children: ReactNode }) {
  return <SubscriptionGate feature="appraisals">{children}</SubscriptionGate>;
}
