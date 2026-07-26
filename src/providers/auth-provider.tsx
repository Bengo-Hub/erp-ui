"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { OfflineBar } from "@bengo-hub/shared-ui-lib/offline";

import { useMe } from "@/hooks/useMe";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth";

const SUBSCRIPTIONS_UI_URL =
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL || "https://pricing.codevertexafrica.com";

/**
 * Guards the tenant shell:
 *  - Hydrates the session into the ApiClient.
 *  - Unauthenticated → redirect to /{orgSlug}/auth/login (NO auto-SSO).
 *  - 401 (after refresh already failed) → clear caches + logout.
 *  - 403 subscription_inactive → Upgrade toast (no logout).
 *  - /platform routes require platform-owner / superuser.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const initialize = useAuthStore((s) => s.initialize);
  const logout = useAuthStore((s) => s.logout);

  const { data: me, isLoading: meLoading, isError: meError, error } = useMe(!!session);
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  const queryClient = useQueryClient();

  const isAuthPath = pathname?.includes("/auth");

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Register response-side callbacks on the ApiClient.
  useEffect(() => {
    apiClient.setOn401(() => {
      const { status: s, lastAuthenticatedAt } = useAuthStore.getState();
      if (s === "syncing" || s === "loading") return;
      // 15s grace after fresh auth — tokens may still be propagating.
      if (lastAuthenticatedAt && Date.now() - lastAuthenticatedAt < 15_000) return;
      queryClient.clear();
      logout();
    });

    apiClient.setOnSubscription403(() => {
      toast.error("Subscription required", {
        description: "Your plan does not cover this action.",
        action: {
          label: "Upgrade",
          onClick: () => window.open(`${SUBSCRIPTIONS_UI_URL}/plans?service=erp`, "_blank", "noopener"),
        },
      });
    });

    return () => {
      apiClient.setOn401(null);
      apiClient.setOnSubscription403(null);
    };
  }, [queryClient, logout]);

  // Unauthenticated → redirect STRAIGHT to SSO (matches treasury-ui's AuthProvider — no
  // intermediate /auth/login landing page). returnTo is the full current URL so SSO returns
  // the user exactly where they were.
  useEffect(() => {
    if (status === "idle" && !isAuthPath && orgSlug) {
      useAuthStore.getState().redirectToSSO(orgSlug, typeof window !== "undefined" ? window.location.href : undefined);
    }
  }, [status, isAuthPath, orgSlug]);

  // /auth/me failed (and it's not a subscription 403) → session is bad, re-auth via SSO.
  useEffect(() => {
    if (meError && orgSlug && !isAuthPath) {
      const data = (error as { response?: { data?: { code?: string; upgrade?: boolean } } })?.response?.data;
      if (data?.code === "subscription_inactive" || data?.upgrade === true) return;
      useAuthStore.getState().redirectToSSO(orgSlug, typeof window !== "undefined" ? window.location.href : undefined);
    }
  }, [meError, error, orgSlug, isAuthPath]);

  // Platform routes require elevated access.
  useEffect(() => {
    const isPlatform = pathname?.includes("/platform");
    const hasAccess = me?.isPlatformOwner || me?.isSuperUser || me?.roles?.includes("superuser");
    if (status === "authenticated" && me && isPlatform && !hasAccess) {
      router.replace(orgSlug ? `/${orgSlug}/unauthorized` : "/");
    }
  }, [status, me, pathname, orgSlug, router]);

  const loading = status === "loading" || (status === "authenticated" && meLoading && !me);
  if (loading && !isAuthPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Initializing session…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <OfflineBar availableOffline={["View cached data"]} disabledOffline={["Edits", "Posting", "Reports"]} />
      {children}
    </>
  );
}
