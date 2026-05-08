import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost:3000',
    '192.168.68.106:3000',
    '192.168.68.106',
    '192.168.68.101:3000',
    '192.168.68.101',
    '102.168.68.101:3000',
    '102.168.68.101'
  ],
  /* config options here */
};

export default nextConfig;
