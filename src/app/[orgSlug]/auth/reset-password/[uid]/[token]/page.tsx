"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const AUTH_UI_URL =
  process.env.NEXT_PUBLIC_AUTH_UI_URL || "https://accounts.codevertexitsolutions.com";

/**
 * Reset-password landing for legacy email links (/{uid}/{token}). The actual
 * reset is completed in the central auth-ui; we forward the link parameters.
 */
export default function ResetPasswordPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || "codevertex";
  const uid = params?.uid as string;
  const token = params?.token as string;

  const target = `${AUTH_UI_URL}/reset-password/${encodeURIComponent(uid)}/${encodeURIComponent(token)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/10 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        <h1 className="text-lg font-bold text-foreground">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Continue to Codevertex Single Sign-On to set a new password.
        </p>
        <a
          href={target}
          className="mt-6 inline-block w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Continue
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
