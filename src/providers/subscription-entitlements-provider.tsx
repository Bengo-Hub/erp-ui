"use client";

import { ReactNode, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  SubscriptionProvider,
  type FeatureCatalogEntry,
  type ServiceUnlockPlan,
  type SubscriptionEntitlements,
} from "@bengo-hub/shared-ui-lib/subscription";

import { useSubscription } from "@/hooks/use-subscription";

const UPGRADE_BASE =
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL || "https://pricing.codevertexafrica.com";

interface CatalogItem {
  featureCode: string;
  label?: string;
  serviceTag?: string;
  minPlanCode?: string;
  minTierLabel?: string;
  minTierOrder?: number;
}

interface RawServiceUnlockPlan {
  planCode: string;
  planName: string;
  tierOrder: number;
  price: number;
}

/**
 * Bridges the app-local useSubscription hook into the shared-ui-lib SubscriptionProvider so
 * FeatureLock / UpgradeDialog / useFeature work anywhere below the authenticated shell.
 *
 * isExempt mirrors the backend IsGatingExempt funnel (platform owner / demo) — exempt tenants
 * see every feature as enabled.
 *
 * The feature catalog (minPlanCode/minTierLabel per feature) is fetched once from the
 * /api/features-catalog proxy so FeatureLock can render "Upgrade to <tier>" + pricing deep-links
 * without a hardcoded per-app feature→tier map.
 */
export function SubscriptionEntitlementsProvider({ children }: { children: ReactNode }) {
  const sub = useSubscription();

  // The catalog is static-ish → fetch once per plan, long cache. Keyed by plan code so
  // serviceUnlockPlans's in-family upgrade suggestion (subscriptions-api's ?plan= param)
  // is correct for whichever plan the tenant is actually on, not a stale cross-tenant cache.
  const { data: catalogData } = useQuery({
    queryKey: ["features-catalog", sub.plan],
    queryFn: async () => {
      const qs = sub.plan ? `?plan=${encodeURIComponent(sub.plan)}` : "";
      const res = await fetch(`/api/features-catalog${qs}`);
      if (!res.ok) return { features: [] as CatalogItem[], serviceUnlockPlans: {} as Record<string, RawServiceUnlockPlan> };
      return (await res.json()) as { features: CatalogItem[]; serviceUnlockPlans?: Record<string, RawServiceUnlockPlan> };
    },
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  const catalog = useMemo<Record<string, FeatureCatalogEntry>>(() => {
    const map: Record<string, FeatureCatalogEntry> = {};
    for (const f of catalogData?.features ?? []) {
      map[f.featureCode] = {
        minPlanCode: f.minPlanCode,
        minTierLabel: f.minTierLabel,
        minTierOrder: f.minTierOrder,
        serviceTag: f.serviceTag,
        label: f.label,
      };
    }
    return map;
  }, [catalogData]);

  // serviceUnlockPlans powers ServiceLock's named "Upgrade to <plan>" CTA for whole-module
  // gates (RequireServiceAccess's service_not_subscribed 403), distinct from `catalog` above
  // which is keyed by individual feature code.
  const serviceUnlockPlans = useMemo<Record<string, ServiceUnlockPlan>>(
    () => catalogData?.serviceUnlockPlans ?? {},
    [catalogData],
  );

  const value = useMemo<SubscriptionEntitlements>(
    () => ({
      features: sub.info?.features ?? [],
      limits: (sub.info?.limits as Record<string, number>) ?? {},
      isExempt: sub.isExempt,
      status: sub.status,
      isLoading: sub.isLoading,
      planCode: sub.plan,
      tierOrder: sub.tierOrder,
      catalog,
      activeServiceTags: sub.activeServiceTags,
      serviceUnlockPlans,
      upgradeBaseUrl: UPGRADE_BASE,
    }),
    [
      sub.info?.features,
      sub.info?.limits,
      sub.isExempt,
      sub.status,
      sub.isLoading,
      sub.plan,
      sub.tierOrder,
      catalog,
      sub.activeServiceTags,
      serviceUnlockPlans,
    ],
  );

  return <SubscriptionProvider value={value}>{children}</SubscriptionProvider>;
}
