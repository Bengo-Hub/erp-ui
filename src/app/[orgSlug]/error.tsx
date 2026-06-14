"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/states";

/**
 * Segment-level error boundary. Renders inside the persistent OrgShell so a
 * failure in any page keeps the sidebar/nav usable and offers a retry.
 */
export default function OrgError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-4 sm:p-6">
      <ErrorState error={error} onRetry={reset} />
    </div>
  );
}
