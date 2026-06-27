"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SubscriptionBanner } from "@/components/subscription/subscription-banner";
import { AuthProvider } from "@/providers/auth-provider";
import { BrandingProvider } from "@/providers/branding-provider";
import { QueryProvider } from "@/providers/query-provider";
import { useTenantFilterStore } from "@/store/tenant-filter";

/** Injects the per-tenant manifest link so PWA installs are tenant-scoped. */
function ManifestLink() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string | undefined;
  useEffect(() => {
    if (!orgSlug) return;
    const href = `/${orgSlug}/manifest.webmanifest`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    if (link.href !== new URL(href, window.location.href).href) link.href = href;
  }, [orgSlug]);
  return null;
}

/** Tenant shell: providers + sidebar + topbar + content. */
export function OrgShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname() || "";
  // Auth pages render full-screen, without the sidebar/topbar chrome.
  const isAuthPage = /\/auth(\/|$)/.test(pathname);
  // Dedicated Platform section: the cross-tenant drill-in (?tenantId=) is confined
  // to /platform. Anywhere else, the platform owner manages their OWN business, so
  // clear any active drill-in to keep business pages scoped to the owner's tenant.
  const isPlatformRoute = /\/platform(\/|$)/.test(pathname);
  useEffect(() => {
    if (isPlatformRoute) return;
    const { selected, select } = useTenantFilterStore.getState();
    if (selected) select(null);
  }, [isPlatformRoute]);

  if (isAuthPage) {
    return (
      <QueryProvider>
        <BrandingProvider>
          <AuthProvider>
            <ManifestLink />
            {children}
          </AuthProvider>
        </BrandingProvider>
      </QueryProvider>
    );
  }

  return (
    <QueryProvider>
      <BrandingProvider>
        <AuthProvider>
          <ManifestLink />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <div className="flex h-screen overflow-hidden bg-background">
            <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <AppTopbar onMenuClick={() => setSidebarOpen(true)} />
              <SubscriptionBanner />
              <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto bg-accent/5">
                <Breadcrumb />
                <div className="min-h-full">{children}</div>
              </main>
            </div>
          </div>
        </AuthProvider>
      </BrandingProvider>
    </QueryProvider>
  );
}
