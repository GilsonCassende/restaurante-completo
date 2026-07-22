import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/production/security";

const nextConfig: NextConfig = {
  async headers() {
    const headers = buildSecurityHeaders();
    return [
      {
        source: "/:path*",
        headers: Object.entries(headers).map(([key, value]) => ({ key, value })),
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
