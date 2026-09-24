import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";
    return [{ source: "/backend/:path*", destination: `${backendUrl}/:path*` }];
  },
};

export default nextConfig;
