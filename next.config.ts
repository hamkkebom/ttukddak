import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "customer-6q1yzz06ggg2ef4g.cloudflarestream.com",
      },
      {
        protocol: "https",
        hostname: "aegupcyteqgehjmsncnn.supabase.co",
      },
    ],
  },
};

export default nextConfig;
