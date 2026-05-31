import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In dev we proxy to the local backend. In production we can proxy
    // to the deployed backend origin so that Set-Cookie headers from the
    // backend become host cookies for the frontend domain (fixes auth middleware).
    const devProxy = process.env.NODE_ENV !== 'production'
      ? [
          {
            source: '/api/:path*',
            destination: 'http://localhost:3001/api/:path*',
          },
        ]
      : [];

    if (process.env.NODE_ENV === 'production') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      // Remove any trailing '/api' so we have the backend origin
      const backendOrigin = apiUrl.replace(/\/api\/?$/i, '').replace(/\/$/, '');
      if (backendOrigin) {
        return [
          {
            source: '/api/:path*',
            destination: `${backendOrigin}/api/:path*`,
          },
        ];
      }
    }

    return devProxy;
  },
};

export default nextConfig;
