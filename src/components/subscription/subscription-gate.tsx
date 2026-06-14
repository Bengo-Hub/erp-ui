"use client";

import { Lock, Zap } from "lucide-react";
import { ReactNode } from "react";

import { Button } from "@/components/ui/base";
import { useSubscription } from "@/hooks/use-subscription";

const SUBSCRIBE_URL =
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL || "https://pricing.codevertexitsolutions.com";

interface SubscriptionGateProps {
  /** Feature code required (e.g. "advanced_payroll"). */
  feature?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wraps content requiring a subscription feature. Renders children optimistically
 * while loading; shows an upgrade prompt when gated.
 */
export function SubscriptionGate({ feature, children, fallback }: SubscriptionGateProps) {
  const { isActive, hasFeature, isLoading } = useSubscription();

  if (isLoading || isActive) {
    if (feature && !isLoading && !hasFeature(feature)) {
      return <>{fallback ?? <UpgradePrompt feature={feature} />}</>;
    }
    return <>{children}</>;
  }
  return <>{fallback ?? <UpgradePrompt feature={feature ?? null} />}</>;
}

function UpgradePrompt({ feature }: { feature: string | null }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Lock className="size-5 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {feature ? "Feature requires upgrade" : "Premium feature"}
        </p>
        <p className="text-xs text-muted-foreground">
          Upgrade your plan to access this feature and more.
        </p>
      </div>
      <a href={`${SUBSCRIBE_URL}/plans?service=erp`} target="_blank" rel="noopener noreferrer">
        <Button size="sm" className="gap-1.5">
          <Zap className="size-3.5" />
          Upgrade plan
        </Button>
      </a>
    </div>
  );
}
