"use client";

import { ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { OutletFilter } from "@/components/outlet/outlet-filter";
import { TenantFilter } from "@/components/outlet/tenant-filter";
import { ThemeToggle } from "@/components/theme-toggle";
import { useBranding } from "@/providers/branding-provider";
import { useAuthStore } from "@/store/auth";

export function AppTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || "codevertex";
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { getServiceTitle } = useBranding();
  const [profileOpen, setProfileOpen] = useState(false);

  const name = user?.fullName || user?.email?.split("@")[0] || "Account";
  const role = user?.roles?.[0] || "Staff";

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
        <TenantFilter className="hidden md:block" />
        <OutletFilter className="hidden md:block" />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggle />
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
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl p-2 shadow-xl border border-border bg-popover">
                  <div className="mb-1 px-3 py-2">
                    <p className="text-sm font-bold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{role}</p>
                  </div>
                  <div className="h-px bg-border my-1" />
                  <Link
                    href={`/${orgSlug}/settings`}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); logout(); }}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
