"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useMemo } from "react";

import { fetchTenantBySlug, type TenantBrand } from "@/lib/api/tenant";

function hexToHslTriplet(hex: string): string {
  const t = hex.replace(/^#/, "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(t)) return "210 90% 45%";
  const r = parseInt(t.slice(0, 2), 16) / 255;
  const g = parseInt(t.slice(2, 4), 16) / 255;
  const b = parseInt(t.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

interface BrandingContextType {
  slug: string;
  tenant: TenantBrand | null;
  isLoading: boolean;
  getServiceTitle: (appName: string) => string;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const DEFAULT_BRAND: TenantBrand = {
  id: "platform",
  name: "Codevertex",
  slug: "codevertex",
  logoUrl: null,
  primaryColor: "#2563eb",
  secondaryColor: "#1e40af",
  orgName: "Codevertex Africa Limited",
  useCase: "other",
};

export function BrandingProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const slug = (params?.orgSlug as string) || "";

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-brand", slug],
    queryFn: () => fetchTenantBySlug(slug),
    staleTime: 6 * 60 * 60 * 1000,
    enabled: !!slug,
  });

  const effectiveBrand = useMemo<TenantBrand>(() => {
    if (tenant) return tenant;
    if (!isLoading && slug) return { ...DEFAULT_BRAND, slug, name: slug, orgName: slug };
    return DEFAULT_BRAND;
  }, [tenant, isLoading, slug]);

  // Apply brand colours as CSS vars driving the Tailwind semantic tokens.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const primary = effectiveBrand.primaryColor || DEFAULT_BRAND.primaryColor!;
    const root = document.documentElement;
    root.style.setProperty("--tenant-primary", primary);
    if (effectiveBrand.logoUrl) {
      root.style.setProperty("--tenant-logo-url", `url(${effectiveBrand.logoUrl})`);
    }
    root.style.setProperty("--primary", hexToHslTriplet(primary));
    root.style.setProperty("--ring", hexToHslTriplet(primary));
    root.style.setProperty("--sidebar-accent", hexToHslTriplet(primary));
  }, [effectiveBrand]);

  const value = useMemo<BrandingContextType>(
    () => ({
      slug,
      tenant: effectiveBrand,
      isLoading,
      getServiceTitle: (appName: string) => {
        const name = effectiveBrand.orgName || effectiveBrand.name || "Codevertex";
        const firstWord = name.split(" ")[0] || "Codevertex";
        return `${firstWord} ${appName}`;
      },
    }),
    [slug, effectiveBrand, isLoading],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    return {
      slug: "",
      tenant: null,
      isLoading: false,
      getServiceTitle: (s: string) => s,
    } satisfies BrandingContextType;
  }
  return ctx;
}
