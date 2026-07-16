import type { ReactNode } from "react";

import { SubscriptionGate } from "@/components/subscription/subscription-gate";

/**
 * Route-level subscription gate for the attendance module (granted from ERP tier 2 per
 * the use-case PowerSuite matrix). Every /hrm/attendance/* page renders behind the
 * "attendance" feature — block-mode upgrade CTA when the tenant's plan lacks it.
 */
export default function AttendanceGateLayout({ children }: { children: ReactNode }) {
  return <SubscriptionGate feature="attendance">{children}</SubscriptionGate>;
}
