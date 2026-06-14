"use client";

import { useParams, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { useAuthStore } from "@/store/auth";

/**
 * Lightweight client guard for pages that must not render to anonymous users.
 * The tenant shell already gates via AuthProvider; use this for extra safety on
 * sensitive subtrees.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;

  useEffect(() => {
    if (status === "idle" && orgSlug) {
      router.replace(`/${orgSlug}/auth/login`);
    }
  }, [status, orgSlug, router]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
