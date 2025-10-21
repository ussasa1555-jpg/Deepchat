/** @type {import('next').NextConfig} */

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' wss://*.supabase.co https://*.supabase.co https://*.upstash.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`;

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // TypeScript hatalarını ignore et (deployment için)
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint hatalarını ignore et (deployment için)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack config for Signal Protocol (browser compatibility)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Browser-side: ignore Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), camera=(), microphone=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

  // Experimental features (serverActions is now default in Next.js 14)

  // Environment variables available to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

module.exports = nextConfig;


