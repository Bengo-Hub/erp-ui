"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Check, ChevronDown, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import { listPlatformTenants } from "@/lib/api/tenant";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useTenantFilterStore, type TenantOption } from "@/store/tenant-filter";

/**
 * Platform-owner tenant drill-in. Selecting a tenant routes API calls through
 * ?tenantId= (handled by the ApiClient + tenant-filter store). Hidden for
 * regular tenant users.
 */
export function TenantFilter({ className }: { className?: string }) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const isPlatformOwner = orgSlug === "codevertex" || !!user?.isPlatformOwner;

  const { selected, select } = useTenantFilterStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: tenants = [] } = useQuery({
    queryKey: ["platform_tenants_list"],
    queryFn: () => listPlatformTenants(),
    enabled: isPlatformOwner && !!session?.accessToken,
    staleTime: 10 * 60_000,
  });

  if (!isPlatformOwner) return null;

  const filtered = search
    ? tenants.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.slug.toLowerCase().includes(search.toLowerCase()),
      )
    : tenants;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors min-w-[180px]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Building2 className="size-4 text-muted-foreground shrink-0" />
        <span className="truncate flex-1 text-left">{selected ? selected.name : "All Tenants"}</span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); select(null); }}
            className="p-0.5 rounded hover:bg-muted-foreground/20"
            aria-label="Clear tenant filter"
          >
            <X className="size-3" />
          </span>
        )}
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} aria-hidden />
          <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-xl border border-border bg-popover shadow-xl flex flex-col">
            <div className="p-2 border-b border-border">
              <input
                autoFocus
                placeholder="Search tenants…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-accent/30 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => { select(null); setOpen(false); setSearch(""); }}
              className={cn(
                "flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm font-medium hover:bg-muted",
                !selected && "bg-primary/10 text-primary",
              )}
            >
              {!selected ? <Check className="size-3.5 shrink-0" /> : <span className="size-3.5 shrink-0" />}
              All Tenants
            </button>
            <div className="max-h-60 overflow-y-auto">
              {filtered.map((t) => {
                const sel = selected?.id === t.id;
                const opt: TenantOption = { id: t.id, slug: t.slug, name: t.name };
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { select(opt); setOpen(false); setSearch(""); }}
                    className={cn("flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm hover:bg-muted", sel && "bg-primary/5")}
                  >
                    <span className={cn("size-3.5 shrink-0 rounded border flex items-center justify-center", sel ? "bg-primary border-primary" : "border-border")}>
                      {sel && <Check className="size-2.5 text-primary-foreground" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-medium">{t.name}</span>
                      <span className="block text-xs text-muted-foreground">{t.slug}</span>
                    </span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-xs text-muted-foreground text-center">No tenants found</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
