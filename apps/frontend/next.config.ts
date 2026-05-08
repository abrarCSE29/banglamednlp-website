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
};

export default nextConfig;
