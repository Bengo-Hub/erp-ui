"use client";

import { ChevronDown, ExternalLink, LogOut, X } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  APP_MENU,
  EXTERNAL_SERVICES_MENU,
  isMenuGroup,
  PLATFORM_MENU,
  type MenuGroup,
  type MenuLink,
} from "@/components/layout/menu-data";
import { useAppPermissions } from "@/hooks/use-app-permissions";
import { cn } from "@/lib/utils";
import { useBranding } from "@/providers/branding-provider";
import { useAuthStore } from "@/store/auth";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || "codevertex";
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { tenant, getServiceTitle } = useBranding();
  const { hasAnyPermission, isPlatformOwner } = useAppPermissions();

  const showPlatform = isPlatformOwner || user?.isPlatformOwner || orgSlug === "codevertex";

  const href = useCallback((to: string) => `/${orgSlug}${to}`, [orgSlug]);
  const isActive = useCallback(
    (to: string) => {
      const full = href(to);
      return to === "" ? pathname === full : pathname?.startsWith(full);
    },
    [href, pathname],
  );

  const canSee = useCallback(
    (link: MenuLink) => !link.permissions?.length || hasAnyPermission(link.permissions),
    [hasAnyPermission],
  );

  const userName = user?.fullName || user?.email?.split("@")[0] || "Account";
  const userRole = user?.roles?.[0] || "Staff";
  const menuLogo = tenant?.logoUrl;

  const content = (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo / tenant band */}
      <div className="border-b border-sidebar-border shrink-0 overflow-hidden h-[72px]">
        {menuLogo ? (
          <div className="flex items-center h-full px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={menuLogo} alt={tenant?.name ?? orgSlug} className="h-full w-auto max-w-full object-contain" />
          </div>
        ) : (
          <div className="flex items-center gap-3 h-full px-4">
            <div className="size-10 shrink-0 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-sm font-bold text-primary-foreground">
                {(tenant?.name ?? "ERP").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-bold text-sidebar-foreground truncate">
              {getServiceTitle("HR")}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-end px-3 pt-2 md:hidden">
        <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-full p-2 hover:bg-muted" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-hide">
        {APP_MENU.map((section) => {
          const visibleItems = section.items.filter((item) =>
            isMenuGroup(item)
              ? item.children.some(canSee)
              : canSee(item),
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/30">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) =>
                  isMenuGroup(item) ? (
                    <NavGroupItem key={item.label} group={item} href={href} isActive={isActive} canSee={canSee} onItemClick={onClose} />
                  ) : (
                    <NavLinkItem key={item.to} item={item} href={href} active={isActive(item.to)} onItemClick={onClose} />
                  ),
                )}
              </ul>
            </div>
          );
        })}

        {showPlatform && (
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/30">Platform</p>
            <ul className="space-y-0.5">
              {PLATFORM_MENU.map((item) => (
                <NavLinkItem key={item.to} item={item} href={href} active={isActive(item.to)} onItemClick={onClose} />
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/30">External Services</p>
          <ul className="space-y-0.5">
            {EXTERNAL_SERVICES_MENU.map((svc) => {
              const Icon = svc.icon;
              return (
                <li key={svc.label}>
                  <a
                    href={svc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-foreground/8 transition-colors"
                  >
                    {Icon && (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full text-sidebar-foreground/40">
                        <Icon className="size-4.5" />
                      </div>
                    )}
                    <span className="truncate flex-1">{svc.label}</span>
                    <ExternalLink className="size-3.5 text-sidebar-foreground/30" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-sidebar-foreground/5">
          <div className="size-8 rounded-lg bg-primary/25 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary uppercase">{(tenant?.name || orgSlug)?.[0] ?? "E"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{userName}</p>
            <p className="text-[10px] text-sidebar-foreground/40 mt-0.5 capitalize">{userRole}</p>
          </div>
          <button
            onClick={() => logout()}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-sidebar-foreground/40 hover:text-rose-500 hover:bg-sidebar-foreground/8 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:z-auto md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {content}
      </aside>
    </>
  );
}

function NavLinkItem({
  item,
  href,
  active,
  onItemClick,
}: {
  item: MenuLink;
  href: (to: string) => string;
  active: boolean;
  onItemClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={href(item.to)}
        onClick={onItemClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm",
          active
            ? "bg-primary/10 text-primary font-semibold"
            : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-foreground/8 font-medium",
        )}
      >
        {Icon && (
          <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", active ? "bg-primary/10 text-primary" : "text-sidebar-foreground/40")}>
            <Icon className="size-4.5" />
          </div>
        )}
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}

function NavGroupItem({
  group,
  href,
  isActive,
  canSee,
  onItemClick,
}: {
  group: MenuGroup;
  href: (to: string) => string;
  isActive: (to: string) => boolean | undefined;
  canSee: (link: MenuLink) => boolean;
  onItemClick?: () => void;
}) {
  const children = useMemo(() => group.children.filter(canSee), [group.children, canSee]);
  const hasActiveChild = children.some((c) => isActive(c.to));
  // `null` = follow active state; true/false = user override. Active children
  // always force-open; a manual toggle takes precedence until navigation changes.
  const [override, setOverride] = useState<boolean | null>(null);
  const expanded = override ?? hasActiveChild;

  const Icon = group.icon;
  if (children.length === 0) return null;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOverride(!expanded)}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm",
          hasActiveChild ? "text-primary font-semibold" : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-foreground/8 font-medium",
        )}
      >
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", hasActiveChild ? "bg-primary/10 text-primary" : "text-sidebar-foreground/40")}>
          <Icon className="size-4.5" />
        </div>
        <span className="flex-1 text-left truncate">{group.label}</span>
        <ChevronDown className={cn("size-4 text-sidebar-foreground/30 transition-transform", expanded && "rotate-180")} />
      </button>
      <ul className={cn("overflow-hidden transition-all", expanded ? "max-h-[40rem] opacity-100" : "max-h-0 opacity-0")}>
        {children.map((child) => (
          <li key={child.to}>
            <Link
              href={href(child.to)}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 pl-12 pr-3 py-2 rounded-xl transition-all text-sm",
                isActive(child.to)
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-sidebar-foreground/45 hover:text-sidebar-foreground hover:bg-sidebar-foreground/8",
              )}
            >
              <span className="truncate">{child.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
