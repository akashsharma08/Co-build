import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Standalone is for Docker/self-hosted builds. On Vercel, Next 16.3 + standalone
  // fails with ENOENT for .next/next-server.js.nft.json (vercel/next.js#96646).
  ...(process.env.VERCEL
    ? {}
    : {
        output: 'standalone' as const,
        outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
      }),
  // Allow LAN access to Next.js dev assets (phone / other devices on the network)
  allowedDevOrigins: ['10.11.7.59'],
};

export default nextConfig;
