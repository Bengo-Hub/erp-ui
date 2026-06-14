"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store/auth";
import { parseJwt } from "@/lib/utils";

// Module-level guard: run the callback once (React Strict Mode double-mounts).
let callbackInvoked = false;

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

  useEffect(() => {
    if (!code || oauthError || callbackInvoked) return;
    callbackInvoked = true;
    const callbackUrl = sessionStorage.getItem("sso_redirect_uri") || `${window.location.origin}/auth/callback`;
    // The slug from the URL is a fallback; the store reads tenant_slug from the JWT.
    handleSSOCallback(orgSlugParam || "", code, callbackUrl);
  }, [code, oauthError, orgSlugParam, handleSSOCallback]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const returnTo = sessionStorage.getItem("sso_return_to");
    sessionStorage.removeItem("sso_return_to");
    // Resolve the real tenant from the stored profile / token.
    const user = useAuthStore.getState().user;
    const session = useAuthStore.getState().session;
    const slug =
      user?.tenantSlug ||
      (session ? (parseJwt(session.accessToken).tenant_slug as string) : "") ||
      orgSlugParam ||
      "codevertex";
    router.replace(returnTo || `/${slug}`);
  }, [status, orgSlugParam, router]);

  const errMessage = (errorDescription || oauthError || authError || "").replace(/\+/g, " ");

  if (errMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center p-8 border border-destructive/20 rounded-2xl bg-destructive/5 max-w-md">
          <h1 className="text-xl font-bold text-destructive mb-2">Authentication failed</h1>
          <p className="text-muted-foreground text-sm">{errMessage}</p>
          <button
            onClick={() => router.replace(`/${orgSlugParam || "codevertex"}/auth/login`)}
            className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </div>
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
