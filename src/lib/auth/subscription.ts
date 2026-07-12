/**
 * Subscription info fetched lazily after login for UI-level feature gating.
 * Login is NEVER blocked by subscription state — the backend enforces on mutations.
 * Fail-open: returns null on any error.
 */

export interface SubscriptionInfo {
  status: string;
  planCode: string;
  planName: string;
  tierOrder?: number;
  features: string[];
  limits: Record<string, number>;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
}

const SUBSCRIPTIONS_API_URL = (
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || "https://pricingapi.codevertexitsolutions.com"
).replace(/\/$/, "");

export async function fetchSubscriptionInfo(
  tenantId: string,
  tenantSlug: string,
  accessToken: string,
): Promise<SubscriptionInfo | null> {
  if (!tenantId && !tenantSlug) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    if (tenantId) headers["X-Tenant-ID"] = tenantId;
    if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;

    // Tenant-scoped endpoint (uses JWT tenant claims). The /tenants/{id}/subscription
    // route is S2S-only (platform API key).
    const url = tenantId
      ? `${SUBSCRIPTIONS_API_URL}/api/v1/tenants/${tenantId}/subscription`
      : `${SUBSCRIPTIONS_API_URL}/api/v1/subscription`;

    const resp = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return null;

    const data = await resp.json();
    const sub = data?.subscription ?? data;
    return {
      status: (sub.status ?? "none").toLowerCase(),
      planCode: sub.plan_code ?? sub.planCode ?? sub.plan ?? "",
      planName: sub.plan_name ?? sub.planName ?? "",
      tierOrder: sub.tier_order ?? sub.tierOrder,
      features: sub.features ?? [],
      limits: sub.limits ?? {},
      trialEndsAt: sub.trial_ends_at ?? sub.trial_end ?? sub.trialEndsAt,
      currentPeriodEnd: sub.current_period_end ?? sub.expires_at ?? sub.currentPeriodEnd,
    };
  } catch {
    return null;
  }
}
