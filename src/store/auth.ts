import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { apiClient } from "@/lib/api/client";
import { authAdminClient } from "@/lib/api/auth-admin-client";
import { useOutletFilterStore } from "@/store/outlet-filter";
import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  exchangeCodeForTokens,
  revokeServerSession,
} from "@/lib/auth/api";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  getVerifier,
  removeVerifier,
  storeState,
  storeVerifier,
} from "@/lib/auth/pkce";
import type { SubscriptionInfo } from "@/lib/auth/subscription";
import type { AuthStatus, Session, UserProfile } from "@/lib/auth/types";
import { parseJwt } from "@/lib/utils";

interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  session: Session | null;
  error: string | null;
  lastAuthenticatedAt: number | null;

  subscriptionInfo: SubscriptionInfo | null | undefined;
  setSubscriptionInfo: (info: SubscriptionInfo | null) => void;

  /** Push the current user's tenant/platform context into the shared ApiClient. */
  syncApiClient: (user: UserProfile) => void;
  initialize: () => void;
  redirectToSSO: (orgSlug: string, returnTo?: string) => Promise<void>;
  handleSSOCallback: (orgSlug: string, code: string, callbackUrl: string) => Promise<void>;
  setUser: (user: UserProfile) => void;
  logout: () => Promise<void>;
}

/** Build a UserProfile from the access-token JWT claims (pre-/auth/me bootstrap). */
function profileFromClaims(claims: Record<string, unknown>): UserProfile {
  const slug = (claims.tenant_slug as string) ?? "";
  return {
    id: (claims.sub as string) ?? "",
    email: (claims.email as string) ?? "",
    fullName: (claims.name as string) ?? (claims.email as string) ?? "",
    roles: Array.isArray(claims.roles) ? (claims.roles as string[]) : [],
    permissions: Array.isArray(claims.permissions) ? (claims.permissions as string[]) : [],
    organizationId: (claims.tenant_id as string) ?? "",
    tenantId: (claims.tenant_id as string) ?? "",
    tenantSlug: slug,
    outletId: (claims.outlet_id as string) ?? null,
    isHqUser: claims.is_hq_user === true,
    isPlatformOwner: claims.is_platform_owner === true || slug === "codevertex",
    isSuperUser: Array.isArray(claims.roles) && (claims.roles as string[]).includes("superuser"),
    subExempt: claims.sub_exempt === true,
    billingMode: (claims.billing_mode as string) ?? "",
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: "idle",
      user: null,
      session: null,
      error: null,
      lastAuthenticatedAt: null,
      subscriptionInfo: undefined,

      setSubscriptionInfo: (info) => set({ subscriptionInfo: info }),

      syncApiClient: (user) => {
        const isPlatform = user.isPlatformOwner || user.tenantSlug === "codevertex";
        apiClient.setPlatformOwner(isPlatform);
        apiClient.setTenantContext(user.tenantId || null, user.tenantSlug || null);
        apiClient.setOutletID(user.isHqUser ? null : user.outletId ?? null);

        // auth-api client (user/role/member admin lives in auth-service, not erp-api).
        authAdminClient.setTenantContext(user.tenantId || null, user.tenantSlug || null);
      },

      initialize: () => {
        const { session, user } = get();
        if (!session) {
          set({ status: "idle" });
          return;
        }
        apiClient.setAccessToken(session.accessToken);
        authAdminClient.setAccessToken(session.accessToken);
        if (user) get().syncApiClient(user);

        if (session.expiresAt) {
          const expiresAt = new Date(session.expiresAt).getTime();
          if (Date.now() < expiresAt - 60_000) {
            set({ status: "authenticated", lastAuthenticatedAt: get().lastAuthenticatedAt ?? Date.now() });
            return;
          }
        }
        // Token near/at expiry — let the refresh interceptor handle it; stay optimistic.
        set({ status: "authenticated" });
      },

      redirectToSSO: async (orgSlug, returnTo) => {
        set({ status: "loading", error: null });
        try {
          const verifier = generateCodeVerifier();
          const challenge = await generateCodeChallenge(verifier);
          const state = generateState();
          storeVerifier(verifier);
          storeState(state);
          if (returnTo) sessionStorage.setItem("sso_return_to", returnTo);

          // Flat /auth/callback is registered for the erp-ui client on every host
          // (exact redirect_uri match). The tenant is recovered from the JWT.
          const callbackUrl = `${window.location.origin}/auth/callback`;
          sessionStorage.setItem("sso_redirect_uri", callbackUrl);

          window.location.href = buildAuthorizeUrl({
            codeChallenge: challenge,
            state,
            redirectUri: callbackUrl,
            tenant: orgSlug,
          });
        } catch {
          set({ status: "error", error: "Failed to start sign-in" });
        }
      },

      handleSSOCallback: async (orgSlug, code, callbackUrl) => {
        set({ status: "syncing", error: null });
        const verifier = getVerifier();
        if (!verifier) {
          set({ status: "error", error: "Session expired. Please sign in again." });
          return;
        }
        try {
          const redirectUri = sessionStorage.getItem("sso_redirect_uri") || callbackUrl;
          const tokens = await exchangeCodeForTokens({ code, codeVerifier: verifier, redirectUri });
          removeVerifier();
          sessionStorage.removeItem("sso_redirect_uri");

          const session: Session = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || "",
            idToken: tokens.id_token,
            expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          };
          apiClient.setAccessToken(session.accessToken);
          authAdminClient.setAccessToken(session.accessToken);

          const claims = parseJwt(tokens.access_token || "");
          const user = profileFromClaims(claims);
          get().syncApiClient(user);
          set({ session, user, status: "authenticated", lastAuthenticatedAt: Date.now() });
        } catch (e) {
          set({ status: "error", error: e instanceof Error ? e.message : "Sign-in failed" });
        }
      },

      setUser: (user) => {
        get().syncApiClient(user);
        set({ user });
      },

      logout: async () => {
        const token = get().session?.accessToken;
        // Revoke the backend session (Redis session_token keys + DB sessions)
        // BEFORE clearing local state, so we still have the access token.
        await revokeServerSession(token);

        set({
          status: "idle",
          user: null,
          session: null,
          subscriptionInfo: undefined,
          lastAuthenticatedAt: null,
        });
        apiClient.setAccessToken(null);
        authAdminClient.setAccessToken(null);
        apiClient.setOutletID(null);
        try { useOutletFilterStore.getState().reset(); } catch { /* no-op */ }
        if (typeof window !== "undefined") {
          try { localStorage.removeItem("erp-auth-storage"); } catch { /* no-op */ }
          try { localStorage.removeItem("erp-outlet-filter"); } catch { /* no-op */ }
          try { sessionStorage.clear(); } catch { /* no-op */ }
          const returnTo = encodeURIComponent(window.location.origin);
          window.location.href = buildLogoutUrl(
            `https://accounts.codevertexitsolutions.com/login?return_to=${returnTo}`,
          );
        }
      },
    }),
    {
      name: "erp-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        lastAuthenticatedAt: state.lastAuthenticatedAt,
      }),
    },
  ),
);
