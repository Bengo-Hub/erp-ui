"use client";

import { ExternalLink } from "lucide-react";

import { Button, Card } from "@/components/ui/base";
import { LoadingState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { EXTERNAL_SERVICES } from "@/config/external-services";
import { useBrandingSettings } from "@/hooks/use-settings";
import { useBranding } from "@/providers/branding-provider";

const EDITOR_URL = `${EXTERNAL_SERVICES.auth}/dashboard/settings?tab=branding`;

function Swatch({ label, color }: { label: string; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 rounded-lg border border-border"
        style={{ background: color || "transparent" }}
      />
      <div>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{color || "—"}</p>
      </div>
    </div>
  );
}

export default function BrandingPage() {
  const { data, isLoading } = useBrandingSettings();
  const { tenant } = useBranding();

  const primary = data?.primary_color || tenant?.primaryColor || undefined;
  const secondary = data?.secondary_color || tenant?.secondaryColor || undefined;
  const logo = data?.logo_url || tenant?.logoUrl || undefined;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Branding"
        subtitle="Logo & brand colours (managed in the accounts portal)"
      />
      <Card className="p-5">
        <p className="text-sm text-muted-foreground">
          Branding is managed centrally in the accounts portal and applied across all
          your services. This is a read-only view — use the editor to make changes.
        </p>

        {isLoading ? (
          <div className="mt-4"><LoadingState /></div>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <Swatch label="Primary colour" color={primary} />
              <Swatch label="Secondary colour" color={secondary} />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Logo</p>
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Brand logo" className="mt-2 h-16 rounded border border-border bg-card object-contain p-2" />
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No logo set</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button size="sm" onClick={() => window.open(EDITOR_URL, "_blank", "noopener")}>
            <ExternalLink className="mr-1.5 size-4" /> Edit branding in accounts portal
          </Button>
        </div>
      </Card>
    </div>
  );
}
