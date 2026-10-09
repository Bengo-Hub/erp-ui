import type { Metadata } from "next";
import { serviceAppName } from "@bengo-hub/shared-ui-lib/branding";

import { OrgShell } from "@/components/layout/org-shell";
import { fetchTenantBySlug } from "@/lib/api/tenant";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

/**
 * Per-tenant metadata: title, theme-color and icons resolved server-side from
 * auth-api branding, plus the per-tenant manifest link (fixes the PWA per-tenant
 * manifest issue — server-rendered, not client-injected).
 */
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { orgSlug } = await params;
  const brand = await fetchTenantBySlug(orgSlug).catch(() => null);
  const name = brand?.orgName || brand?.name || "Codevertex";
  // Shared rule (shared-ui-lib branding): "The Urban Loft Cafe" gives "The Urban HR".
  const title = serviceAppName(name, "HR", "Codevertex");

  return {
    title,
    description: `${name} — HR and internal operations`,
    manifest: `/${orgSlug}/manifest.webmanifest`,
    icons: brand?.logoUrl ? { icon: brand.logoUrl, apple: brand.logoUrl } : undefined,
    appleWebApp: { capable: true, statusBarStyle: "default", title },
  };
}

export async function generateViewport({ params }: LayoutProps) {
  const { orgSlug } = await params;
  const brand = await fetchTenantBySlug(orgSlug).catch(() => null);
  return { themeColor: brand?.primaryColor || "#2563eb" };
}

export default function OrgLayout({ children }: LayoutProps) {
  return <OrgShell>{children}</OrgShell>;
}
