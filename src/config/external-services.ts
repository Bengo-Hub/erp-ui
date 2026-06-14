/**
 * External microservice frontends. ERP-UI is HR + internal operations; every
 * other business domain lives in its own service with its own frontend, linked
 * out (new tab) from the sidebar "External Services" group.
 *
 * Mapped from the Vue VITE_*_UI_URL vars to NEXT_PUBLIC_*_UI_URL.
 */

export const EXTERNAL_SERVICES = {
  finance:
    process.env.NEXT_PUBLIC_TREASURY_UI_URL || "https://books.codevertexitsolutions.com",
  crm:
    process.env.NEXT_PUBLIC_MARKETFLOW_UI_URL || "https://marketflow.codevertexitsolutions.com",
  // inventory frontend also owns products, procurement, manufacturing and assets
  inventory:
    process.env.NEXT_PUBLIC_INVENTORY_UI_URL || "https://inventory.codevertexitsolutions.com",
  pos: process.env.NEXT_PUBLIC_POS_UI_URL || "https://pos.codevertexitsolutions.com",
  ordering:
    process.env.NEXT_PUBLIC_ORDERING_UI_URL || "https://ordersapp.codevertexitsolutions.com",
  notifications:
    process.env.NEXT_PUBLIC_NOTIFICATIONS_UI_URL ||
    "https://notifications.codevertexitsolutions.com",
  projects:
    process.env.NEXT_PUBLIC_PROJECTS_UI_URL || "https://projects.codevertexitsolutions.com",
  billing:
    process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL || "https://pricing.codevertexitsolutions.com",
  auth: process.env.NEXT_PUBLIC_AUTH_UI_URL || "https://accounts.codevertexitsolutions.com",
} as const;

export type ExternalServiceKey = keyof typeof EXTERNAL_SERVICES;

export function openExternalService(service: ExternalServiceKey) {
  const url = EXTERNAL_SERVICES[service];
  if (url && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener");
  }
}
