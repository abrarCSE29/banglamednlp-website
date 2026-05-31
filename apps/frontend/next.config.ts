import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    // Allow any local network access
    "192.168.0.101",
    "192.168.0.106",
    "192.168.68.101",
    "192.168.68.106",
    "10.0.0.101",
    "10.0.0.106",
  ],
  async rewrites() {
    // Proxy /api requests to local backend during development so cookies are same-origin
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
