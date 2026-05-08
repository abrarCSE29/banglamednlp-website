import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.0.101",
    "192.168.0.106",
  ],
  /* config options here */
};

export default nextConfig;
