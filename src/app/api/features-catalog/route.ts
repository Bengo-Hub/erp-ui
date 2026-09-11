import { NextRequest, NextResponse } from "next/server";

// The features catalog lives on the platform subscriptions-api (pricingapi) — unlike the
// runtime-derived erp-api host in api-client, this proxy always targets the pricing API.
// Server-to-server call — prefer the in-cluster Service DNS so this never
// leaves the cluster and round-trips through the public ingress/Cloudflare.
const PRICING_API =
  process.env.SUBSCRIPTION_BASE_URL ||
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL ||
  "https://pricingapi.codevertexafrica.com";

const SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? "";

/**
 * Proxy the platform feature catalog (with the minPlanCode/minTierLabel each feature unlocks, and
 * serviceUnlockPlans for whole-module gates) so the shared SubscriptionProvider can render
 * "Upgrade to <tier>" without a hardcoded per-app map.
 * GET /api/features-catalog?plan=<planCode> — plan is forwarded as-is so serviceUnlockPlans
 * prefers an in-family upgrade suggestion over the globally cheapest cross-product plan.
 */
export async function GET(req: NextRequest) {
  try {
    const plan = req.nextUrl.searchParams.get("plan");
    const qs = plan ? `?plan=${encodeURIComponent(plan)}` : "";
    const upstream = await fetch(`${PRICING_API}/api/v1/features/catalog${qs}`, {
      headers: SERVICE_KEY ? { "X-API-Key": SERVICE_KEY } : {},
      // Per-plan responses aren't safely shareable across tenants on different plans — only
      // cache the no-plan (tenant-agnostic) request.
      next: plan ? { revalidate: 0 } : { revalidate: 3600 },
    });
    if (!upstream.ok) return NextResponse.json({ features: [] }, { status: upstream.status });
    return NextResponse.json(await upstream.json());
  } catch {
    return NextResponse.json({ features: [] }, { status: 503 });
  }
}
