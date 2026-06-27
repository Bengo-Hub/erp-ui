import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: true,
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Offline shell served when a navigation request fails with no network.
  fallbacks: { document: "/offline" },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    // The service worker must NEVER serve API responses from cache — otherwise a GET
    // refetched right after a mutation returns a stale cached body. Force all API
    // traffic (erp-api / auth-api hosts and any /api/ path) straight to the network.
    runtimeCaching: [
      {
        urlPattern: ({ url }: { url: URL }) =>
          url.pathname.includes("/api/") ||
          // Any erp-api / auth host across tenant domains (erpapi.<domain>, sso.*, …).
          /^(erpapi|sso|accounts|pricingapi)[.-]/.test(url.hostname),
        handler: "NetworkOnly" as const,
      },
    ],
  },
});

const nextConfig: NextConfig = {
  ...(process.env.SKIP_STANDALONE !== "true" && { output: "standalone" as const }),
  experimental: {
    // Tree-shake barrel imports from heavy icon/chart packages so unused exports
    // don't land in the client bundle.
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
  images: {
    remotePatterns: [
      // Platform backend + any tenant subdomain under the platform domain.
      { protocol: "https", hostname: "erpapi.codevertexitsolutions.com" },
      { protocol: "https", hostname: "*.codevertexitsolutions.com" },
      // Known tenant custom domains (wildcard covers erpapi.<tenant>).
      { protocol: "https", hostname: "*.masterspace.co.ke" },
    ],
  },
  turbopack: {},
};

export default withPWA(nextConfig);
