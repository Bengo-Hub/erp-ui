import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
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
          /(erpapi\.masterspace\.co\.ke|sso|accounts|pricingapi)\.?codevertexitsolutions\.com$/.test(
            url.hostname,
          ) ||
          url.hostname === "erpapi.masterspace.co.ke",
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
      { protocol: "https", hostname: "erpapi.masterspace.co.ke" },
      { protocol: "https", hostname: "accounts.codevertexitsolutions.com" },
      { protocol: "https", hostname: "sso.codevertexitsolutions.com" },
    ],
  },
  turbopack: {},
};

export default withPWA(nextConfig);
