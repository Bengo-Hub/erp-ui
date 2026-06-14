"use client";

import { useEffect } from "react";

import { fetchSubscriptionInfo, type SubscriptionInfo } from "@/lib/auth/subscription";
import { useAuthStore } from "@/store/auth";

/**
 * Lazily loads the tenant subscription after login for UI-level gating.
 * Fail-open: never blocks the UI. Platform owners / demo tenants are exempt.
 */
export function useSubscription() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const subscriptionInfo = useAuthStore((s) => s.subscriptionInfo);
  const setSubscriptionInfo = useAuthStore((s) => s.setSubscriptionInfo);

  const tenantId = user?.tenantId ?? null;
  const tenantSlug = user?.tenantSlug ?? null;
  const roles = (user?.roles ?? []).map((r) => r.toLowerCase());
  const isSuperuser = roles.includes("superuser") || roles.includes("super_admin");
  const isPlatformOwner = !!user?.isPlatformOwner || isSuperuser || tenantSlug === "codevertex";
  const isDemo = tenantSlug === "codevertex-demo";
  const isExempt = isPlatformOwner || isDemo;

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken || !user) return;
    if (subscriptionInfo !== undefined) return;
    setSubscriptionInfo(null); // mark loading

    if (!tenantId || isExempt) {
      setSubscriptionInfo({
        status: "active",
        planCode: "enterprise",
        planName: "Enterprise",
        features: [],
        limits: {},
      });
      return;
    }

    fetchSubscriptionInfo(tenantId, tenantSlug ?? "", session.accessToken)
      .then((info) =>
        setSubscriptionInfo(
          info ?? { status: "none", planCode: "", planName: "", features: [], limits: {} },
        ),
      )
      .catch(() =>
        setSubscriptionInfo({ status: "none", planCode: "", planName: "", features: [], limits: {} }),
      );
  }, [status, session?.accessToken, user, subscriptionInfo, setSubscriptionInfo, tenantId, tenantSlug, isExempt]);

  const info = subscriptionInfo as SubscriptionInfo | null | undefined;
  const subStatus = info?.status ?? null;

  return {
    info,
    status: subStatus,
    plan: info?.planCode ?? null,
    isActive: subStatus === "active" || subStatus === "trial" || isExempt,
    isTrial: subStatus === "trial",
    isPastDue: subStatus === "past_due" || subStatus === "suspended",
    isExpired: subStatus === "expired" || subStatus === "cancelled",
    needsSubscription: subStatus === "none" && !isExempt,
    isLoading: subscriptionInfo === null || subscriptionInfo === undefined,
    isPlatformOwner,
    isExempt,
    expiresAt: info?.currentPeriodEnd ?? info?.trialEndsAt ?? null,
    hasFeature: (code: string) => isExempt || (info?.features?.includes(code) ?? false),
    getLimit: (key: string) => (isExempt ? Infinity : (info?.limits?.[key] ?? Infinity)),
  };
}
