"use client";

import { AlertCircle, Clock, Zap } from "lucide-react";

import { useSubscription } from "@/hooks/use-subscription";

const SUBSCRIPTIONS_UI_URL =
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL || "https://pricing.codevertexitsolutions.com";

/**
 * Thin top-of-content banner shown when the tenant subscription needs attention.
 * Never blocks the app; offers an Upgrade / Renew link.
 */
export function SubscriptionBanner() {
  const sub = useSubscription();

  if (sub.isLoading || sub.isExempt) return null;
  if (sub.isActive && !sub.isPastDue) return null;

  let icon = <AlertCircle className="size-4 shrink-0" />;
  let message = "Your subscription is inactive.";
  let tone = "bg-destructive/10 text-destructive border-destructive/20";

  if (sub.isTrial) {
    icon = <Clock className="size-4 shrink-0" />;
    message = "You are on a trial plan.";
    tone = "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
  } else if (sub.isPastDue) {
    icon = <Clock className="size-4 shrink-0" />;
    message = "Your subscription payment is past due.";
    tone = "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
  } else if (sub.isExpired) {
    message = "Your subscription has expired.";
  } else if (sub.needsSubscription) {
    message = "No active subscription found for this organization.";
  }

  return (
    <div className={`flex items-center gap-3 border-b px-4 py-2 text-sm font-medium ${tone}`}>
      {icon}
      <span className="flex-1 truncate">{message}</span>
      <a
        href={`${SUBSCRIPTIONS_UI_URL}/plans?service=erp`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-lg bg-current/10 px-2.5 py-1 text-xs font-bold hover:bg-current/20"
      >
        <Zap className="size-3.5" />
        {sub.isPastDue ? "Renew" : "Upgrade"}
      </a>
    </div>
  );
}
