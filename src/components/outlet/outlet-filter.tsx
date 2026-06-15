"use client";

import { Check, ChevronDown, Store, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useOutlets } from "@/hooks/use-outlets";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useOutletFilterStore } from "@/store/outlet-filter";

/**
 * Single-select outlet/branch filter for HQ/admin users. Hidden for staff pinned
 * to a single outlet (the backend scopes them automatically).
 */
export function OutletFilter({ className, tenantSlug }: { className?: string; tenantSlug?: string }) {
  const user = useAuthStore((s) => s.user);
  const canFilter = !!(
    user?.isPlatformOwner ||
    user?.isSuperUser ||
    user?.isHqUser ||
    user?.roles?.some((r) => ["admin", "superuser", "manager", "hr_admin"].includes(r))
  );

  const slug = tenantSlug || user?.tenantSlug || "";
  const { selectedOutlet, outlets, setOutlets, selectOutlet, clearOutlet, autoInitialized, setAutoInitialized } =
    useOutletFilterStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: fetched = [] } = useOutlets(slug, canFilter);

  useEffect(() => {
    if (fetched.length > 0) {
      setOutlets(
        fetched.map((o) => ({ id: o.id, code: o.code, name: o.name, useCase: o.use_case, isHq: o.is_hq })),
      );
    }
  }, [fetched, setOutlets]);

  // Preselect the user's assigned/default outlet once per session (login-time default).
  // Priority: the JWT outlet claim → the sole outlet (single-outlet tenants) → leave "All
  // Outlets" for multi-outlet all-access admins (don't silently hide other outlets' data).
  useEffect(() => {
    if (autoInitialized || outlets.length === 0) return;
    if (!selectedOutlet) {
      const byClaim = user?.outletId ? outlets.find((o) => o.id === user.outletId) : null;
      const def = byClaim ?? (outlets.length === 1 ? outlets[0] : null);
      if (def) selectOutlet(def);
    }
    setAutoInitialized(true);
  }, [autoInitialized, outlets, selectedOutlet, user?.outletId, selectOutlet, setAutoInitialized]);

  useEffect(() => {
    apiClient.setOutletID(selectedOutlet?.id ?? null);
  }, [selectedOutlet]);

  if (!canFilter || outlets.length === 0) return null;

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors min-w-[160px]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Store className="size-4 text-muted-foreground shrink-0" />
        <span className="truncate flex-1 text-left">{selectedOutlet ? selectedOutlet.name : "All Outlets"}</span>
        {selectedOutlet && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); clearOutlet(); }}
            className="p-0.5 rounded hover:bg-muted-foreground/20"
            aria-label="Clear outlet filter"
          >
            <X className="size-3" />
          </span>
        )}
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border border-border bg-popover shadow-xl flex flex-col">
            <button
              type="button"
              onClick={() => { clearOutlet(); setOpen(false); }}
              className={cn(
                "flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm font-medium hover:bg-muted",
                !selectedOutlet && "bg-primary/10 text-primary",
              )}
            >
              {!selectedOutlet ? <Check className="size-3.5 shrink-0" /> : <span className="size-3.5 shrink-0" />}
              All Outlets
            </button>
            <div className="max-h-56 overflow-y-auto">
              {outlets.map((o) => {
                const sel = selectedOutlet?.id === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => { selectOutlet(o); setOpen(false); }}
                    className={cn("flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm hover:bg-muted", sel && "bg-primary/5")}
                  >
                    <span className={cn("size-3.5 shrink-0 rounded-full border flex items-center justify-center", sel ? "bg-primary border-primary" : "border-border")}>
                      {sel && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-medium">{o.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {o.code}{o.useCase ? ` · ${o.useCase}` : ""}{o.isHq ? " · HQ" : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
