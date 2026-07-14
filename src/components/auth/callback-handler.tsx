"use client";

import { SSOCallbackError } from "@bengo-hub/shared-ui-lib/auth";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store/auth";
import { parseJwt } from "@/lib/utils";

// Module-level guard: run the callback once (React Strict Mode double-mounts).
let callbackInvoked = false;

// The stored return URL was captured BEFORE the SSO hop. If the user switched
// organisation mid-login, its slug is stale — re-point the first path segment
// at the org the token was actually issued for. Cross-origin values are dropped.
function sanitizedReturnTo(raw: string | null, orgSlug: string): string | null {
  if (!raw) return null;
  try {
    const url = raw.startsWith("http") ? new URL(raw) : new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const segments = url.pathname.split("/");
    if (segments[1] && segments[1] !== orgSlug) segments[1] = orgSlug;
    return segments.join("/") + url.search + url.hash;
  } catch {
    return null;
  }
}

/**
 * Handles the OIDC redirect for both the tenant-scoped (/{orgSlug}/auth/callback)
 * and flat (/auth/callback) routes. The real tenant slug is recovered from the
 * JWT, so the flat callback works for every tenant.
 */
export function CallbackHandler() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orgSlugParam = params?.orgSlug as string | undefined;

  const code = searchParams?.get("code");
  const oauthError = searchParams?.get("error");
  const errorDescription = searchParams?.get("error_description");

  const handleSSOCallback = useAuthStore((s) => s.handleSSOCallback);
  const status = useAuthStore((s) => s.status);
  const authError = useAuthStore((s) => s.error);
  // Tenant persisted from the last successful login (erp-auth-storage).
  const persistedSlug = useAuthStore((s) => s.user?.tenantSlug ?? null);

  useEffect(() => {
    if (!code || oauthError || callbackInvoked) return;
    callbackInvoked = true;
    const callbackUrl = sessionStorage.getItem("sso_redirect_uri") || `${window.location.origin}/auth/callback`;
    // The slug from the URL is a fallback; the store reads tenant_slug from the JWT.
    handleSSOCallback(orgSlugParam || "", code, callbackUrl);
  }, [code, oauthError, orgSlugParam, handleSSOCallback]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const rawReturnTo = sessionStorage.getItem("sso_return_to");
    sessionStorage.removeItem("sso_return_to");
    // Resolve the real tenant from the stored profile / token.
    const user = useAuthStore.getState().user;
    const session = useAuthStore.getState().session;
    const slug =
      user?.tenantSlug ||
      (session ? (parseJwt(session.accessToken).tenant_slug as string) : "") ||
      orgSlugParam ||
      "codevertex";
    const returnTo = sanitizedReturnTo(rawReturnTo, slug);
    router.replace(returnTo || `/${slug}`);
  }, [status, orgSlugParam, router]);

  const errMessage = (errorDescription || oauthError || authError || "").replace(/\+/g, " ");

  if (errMessage) {
    // Retry must target a real tenant: URL slug first, then the tenant persisted
    // from the last successful login (erp-auth-storage), and only then the
    // historical "codevertex" fallback — which used to loop for everyone else.
    // "Sign in again" restarts the SSO flow; /authorize now routes wrong-org
    // users through the accounts organisation picker, so it genuinely recovers.
    const retrySlug = orgSlugParam || persistedSlug || "codevertex";
    return (
      <SSOCallbackError
        error={oauthError}
        errorDescription={(errorDescription || authError || "").replace(/\+/g, " ") || null}
        orgSlug={retrySlug}
        lastKnownTenant={persistedSlug && persistedSlug !== retrySlug ? persistedSlug : null}
        onRetry={() => router.replace(`/${retrySlug}/auth/login`)}
        onSwitchTenant={(slug) => router.replace(`/${slug}/auth/login`)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-foreground">Completing sign-in…</h1>
        <p className="text-sm text-muted-foreground">Syncing your profile and permissions.</p>
      </div>
    </div>
  );
}
