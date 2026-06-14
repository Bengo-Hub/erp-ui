"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UnauthorizedPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || "codevertex";
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-7" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Access denied</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        You do not have permission to view this page. Contact your administrator if
        you believe this is a mistake.
      </p>
      <Link
        href={`/${orgSlug}`}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
