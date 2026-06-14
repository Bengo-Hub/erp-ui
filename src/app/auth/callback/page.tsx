import { Suspense } from "react";

import { CallbackHandler } from "@/components/auth/callback-handler";
import { QueryProvider } from "@/providers/query-provider";

/**
 * Flat /auth/callback — the redirect_uri registered for the erp-ui client on
 * every host. The tenant is recovered from the JWT, then the user is routed to
 * /{tenantSlug}.
 */
export default function FlatCallbackPage() {
  return (
    <QueryProvider>
      <Suspense fallback={<Fallback />}>
        <CallbackHandler />
      </Suspense>
    </QueryProvider>
  );
}

function Fallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
