import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  // Allow LAN access to Next.js dev assets (phone / other devices on the network)
  allowedDevOrigins: ['10.11.7.59'],
};

export default nextConfig;
