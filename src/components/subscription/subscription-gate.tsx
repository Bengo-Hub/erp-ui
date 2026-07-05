"use client";

import { ReactNode } from "react";

import { FeatureLock } from "@bengo-hub/shared-ui-lib/subscription";

interface SubscriptionGateProps {
  /** Feature code required (e.g. "advanced_payroll"). */
  feature?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * SubscriptionGate — the platform's "show, don't hide" gate.
 *
 * Children are ALWAYS rendered. When a `feature` code is provided and the tenant's plan lacks
 * it, the shared FeatureLock (mode="block") wraps the content with an upgrade CTA that opens
 * the UpgradeDialog naming the unlocking tier + deep-linking to pricing — never a dead-end
 * replacement or hidden UI.
 *
 * `fallback` is kept for call-site compatibility; the shared FeatureLock resolves the required
 * tier from the platform feature catalog, so it is no longer used. Expired/none subscription
 * states are surfaced by <SubscriptionBanner /> in the shell, not by hiding page content here.
 */
export function SubscriptionGate({ feature, children }: SubscriptionGateProps) {
  if (!feature) return <>{children}</>;
  return (
    <FeatureLock feature={feature} mode="block">
      {children}
    </FeatureLock>
  );
}
