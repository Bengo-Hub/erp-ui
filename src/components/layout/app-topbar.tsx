"use client";

import { ChevronDown, Menu, Settings, User } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

import { OutletFilter } from "@/components/outlet/outlet-filter";
import { TenantFilter } from "@/components/outlet/tenant-filter";
import { ThemeToggle } from "@/components/theme-toggle";
import { useBranding } from "@/providers/branding-provider";
import { useAuthStore } from "@/store/auth";
import { useVisibleServices, AppSwitcherGrid, AppSwitcherTrigger, type ServiceKey } from "@bengo-hub/shared-ui-lib/app-switcher";
import { AccountPanel } from "@bengo-hub/shared-ui-lib/account-panel";

// erp-ui never wired the shared app-switcher before — this is its first adoption, not a
// migration. 'erp' itself is omitted (never links to itself, mirrors every other *-ui).
const SERVICE_URLS: Partial<Record<ServiceKey, string>> = {
  pos: process.env.NEXT_PUBLIC_POS_UI_URL ?? "https://pos.codevertexafrica.com",
  inventory: process.env.NEXT_PUBLIC_INVENTORY_UI_URL ?? "https://inventory.codevertexafrica.com",
  treasury: process.env.NEXT_PUBLIC_TREASURY_UI_URL ?? "https://books.codevertexafrica.com",
  marketflow: process.env.NEXT_PUBLIC_MARKETFLOW_UI_URL ?? "https://marketflow.codevertexafrica.com",
  ordering: process.env.NEXT_PUBLIC_ORDERING_UI_URL ?? "https://ordering.codevertexafrica.com",
  subscriptions: process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL ?? "https://pricing.codevertexafrica.com",
  auth: process.env.NEXT_PUBLIC_AUTH_UI_URL ?? "https://accounts.codevertexafrica.com",
  projects: process.env.NEXT_PUBLIC_PROJECTS_UI_URL ?? "https://projects.codevertexafrica.com",
  afya: process.env.NEXT_PUBLIC_HOSPITAL_UI_URL ?? "https://afya.codevertexafrica.com",
};

export function AppTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const params = useParams();
  const pathname = usePathname() || "";
  const orgSlug = (params?.orgSlug as string) || "codevertex";
  // The cross-tenant drill-in is confined to the platform section: the main app
  // always operates on the owner's OWN business (see OrgShell off-platform reset).
  const isPlatformRoute = /\/platform(\/|$)/.test(pathname);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { getServiceTitle } = useBranding();
  const [profileOpen, setProfileOpen] = useState(false);

  const name = user?.fullName || user?.email?.split("@")[0] || "Account";
  const role = user?.roles?.[0] || "Staff";

  // The App Store shows every real service to every authenticated user in the tenant — each
  // destination service already enforces its own RBAC + subscription gating on arrival.
  const services = useVisibleServices({ orgSlug, urls: SERVICE_URLS, canManageLinks: true });

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-foreground truncate max-w-40 sm:max-w-none">
          {getServiceTitle("HR")}
        </h1>
        {isPlatformRoute && <TenantFilter className="hidden md:block" />}
        <OutletFilter className="hidden md:block" />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggle />

        {user && <AppSwitcherTrigger services={services} />}

        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full hover:bg-muted p-1 pr-2 transition-colors"
              aria-haspopup="true"
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
            >
              <div className="size-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {name[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-foreground truncate max-w-30">{name}</p>
                <p className="text-[10px] font-medium text-muted-foreground capitalize">{role}</p>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform hidden sm:block ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            <AccountPanel
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
              user={{ name, email: user?.email ?? "" }}
              onSignOut={() => { setProfileOpen(false); logout(); }}
            >
              <div className="flex flex-col gap-3">
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {role}
                </p>
                <Link
                  href={`/${orgSlug}/settings`}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <AppSwitcherGrid services={services} onNavigate={() => setProfileOpen(false)} />
              </div>
            </AccountPanel>
          </div>
        )}
      </div>
    </header>
  );
}
