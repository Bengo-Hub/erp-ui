"use client";

import { PwaInstallPrompt } from "@bengo-hub/shared-ui-lib/offline";
import { toast } from "sonner";
import { useBranding } from "@/providers/branding-provider";

/** Tenant-branded install prompt — must live inside BrandingProvider, or useBranding() always
 *  sees the no-provider fallback (tenant: null) and the prompt never shows the real tenant
 *  name/logo (the exact gotcha treasury-ui's equivalent component documents). */
export function PWARegistration() {
  const { tenant } = useBranding();
  const tenantFirstWord = tenant?.orgName?.trim().split(/\s+/)[0];
  const appName = tenantFirstWord ? `${tenantFirstWord} HR` : "Codevertex ERP";

  return (
    <PwaInstallPrompt
      appName={appName}
      logoUrl={tenant?.logoUrl}
      tagline="Manage HR, payroll & operations from your home screen."
      dismissKey="erp_pwa_install_dismissed_until"
      onInstalled={() => toast.success(`${appName} installed!`)}
    />
  );
}
