"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const AUTH_UI_URL =
  process.env.NEXT_PUBLIC_AUTH_UI_URL || "https://accounts.codevertexitsolutions.com";

/**
 * Password reset is owned by the central auth-ui (SSO). We deep-link to it rather
 * than duplicating the flow here.
 */
export default function ForgotPasswordPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || "codevertex";
  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/10 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        <h1 className="text-lg font-bold text-foreground">Forgot your password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Password resets are handled by Codevertex Single Sign-On.
        </p>
        <a
          href={`${AUTH_UI_URL}/forgot-password`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Reset password
        </a>
        <Link
          href={`/${orgSlug}/auth/login`}
          className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
