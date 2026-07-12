"use client";

import { useEffect, useRef } from "react";

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
  // Mirrors the backend IsGatingExempt funnel (shared-auth-client Claims.IsGatingExempt):
  // platform owner, demo tenant, platform-granted per-tenant exemption (sub_exempt JWT
  // claim), or service-charge billing mode all bypass subscription gating entirely. Without
  // sub_exempt here, an explicitly-exempt tenant still saw the "no active subscription" /
  // Upgrade banner and feature locks whenever the subscription-info fetch was slow, failed,
  // or the tenant's local subscriptions-api tenant shadow hadn't been JIT-synced yet.
  const isExempt =
    isPlatformOwner || isDemo || !!user?.subExempt || user?.billingMode === "service_charge";

  // Bounded retry counter for a FAILED subscription lookup (see the fetch effect).
  const lookupRetries = useRef(0);

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

    // A FAILED lookup (network/5xx/timeout) is NOT the same as "no subscription".
    // fetchSubscriptionInfo returns null ONLY on failure — never collapse that to
    // status:'none', which would trigger the full-page "Subscription Required" lockout for
    // a genuinely-active tenant (e.g. while subscription-api is mid-redeploy). Instead FAIL
    // OPEN: erp-ui has no offline subscription store, so set a non-blocking 'unknown' status
    // (deliberately NOT 'none', so needsSubscription stays false), and retry a few times so
    // it self-heals when the API returns.
    const handleLookupFailure = () => {
      setSubscriptionInfo({
        status: "unknown",
        planCode: "",
        planName: "",
        features: [],
        limits: {},
      });
      if (lookupRetries.current < 4) {
        lookupRetries.current += 1;
        // Re-arm the effect (subscriptionInfo → undefined) after a short delay to re-fetch.
        setTimeout(() => setSubscriptionInfo(undefined as unknown as null), 8000);
      }
    };

    fetchSubscriptionInfo(tenantId, tenantSlug ?? "", session.accessToken)
      .then((info) => {
        if (info === null) {
          handleLookupFailure();
          return;
        }
        lookupRetries.current = 0;
        setSubscriptionInfo(info);
      })
      .catch(() => handleLookupFailure());
  }, [status, session?.accessToken, user, subscriptionInfo, setSubscriptionInfo, tenantId, tenantSlug, isExempt]);

  const info = subscriptionInfo as SubscriptionInfo | null | undefined;
  const subStatus = info?.status ?? null;

  return {
    info,
    status: subStatus,
    plan: info?.planCode ?? null,
    tierOrder: info?.tierOrder ?? null,
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
