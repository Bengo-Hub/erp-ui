"use client";

import { Store } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { useOutlets } from "@/hooks/use-outlets";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth";
import { useOutletFilterStore } from "@/store/outlet-filter";

/** Outlet picker shown to HQ users with multiple outlets after login. */
export default function SelectOutletPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = (params?.orgSlug as string) || "codevertex";
  const user = useAuthStore((s) => s.user);
  const selectOutlet = useOutletFilterStore((s) => s.selectOutlet);
  const slug = user?.tenantSlug || orgSlug;

  const { data: outlets = [], isLoading } = useOutlets(slug);

  const pick = (id: string, code: string, name: string) => {
    apiClient.setOutletID(id);
    selectOutlet({ id, code, name });
    router.replace(`/${orgSlug}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/10 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-lg font-bold text-foreground mb-1">Select an outlet</h1>
        <p className="text-sm text-muted-foreground mb-6">Choose the branch you want to work in.</p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading outlets…</p>
        ) : outlets.length === 0 ? (
          <button
            onClick={() => router.replace(`/${orgSlug}`)}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
          >
            Continue
          </button>
        ) : (
          <ul className="space-y-2">
            {outlets.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => pick(o.id, o.code, o.name)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted transition-colors"
                >
                  <Store className="size-4 text-primary shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-foreground truncate">{o.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {o.code}{o.is_hq ? " · HQ" : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
