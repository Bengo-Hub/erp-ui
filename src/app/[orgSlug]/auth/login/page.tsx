"use client";

import { LogIn } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/base";
import { useBranding } from "@/providers/branding-provider";
import { useAuthStore } from "@/store/auth";

/**
 * Tenant login page. Does NOT auto-launch SSO — the user clicks Sign in, which
 * starts the PKCE flow scoped to this org slug.
 */
export default function LoginPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = (params?.orgSlug as string) || "codevertex";
  const status = useAuthStore((s) => s.status);
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const { tenant, getServiceTitle } = useBranding();

  // Already authenticated → bounce to the dashboard.
  useEffect(() => {
    if (status === "authenticated") {
      const returnTo = sessionStorage.getItem("sso_return_to");
      sessionStorage.removeItem("sso_return_to");
      router.replace(returnTo || `/${orgSlug}`);
    }
  }, [status, orgSlug, router]);

  const signIn = () => {
    const returnTo = sessionStorage.getItem("sso_return_to") || `/${orgSlug}`;
    redirectToSSO(orgSlug, returnTo);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/10 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        {tenant?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tenant.logoUrl} alt={tenant.name} className="h-12 mx-auto mb-6 object-contain" />
        ) : (
          <div className="size-14 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">
              {(tenant?.name ?? "ER").slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <h1 className="text-xl font-bold text-foreground">{getServiceTitle("HR")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your {tenant?.name ?? "organization"} account to continue.
        </p>

        <Button onClick={signIn} className="mt-6 w-full gap-2" disabled={status === "loading"}>
          <LogIn className="size-4" />
          {status === "loading" ? "Redirecting…" : "Sign in with SSO"}
        </Button>

        <p className="mt-6 text-xs text-muted-foreground">
          Secured by Codevertex Single Sign-On.
        </p>
      </div>
    </div>
  );
}
