import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['3000.indwo.org'],
  experimental: {
    proxyClientMaxBodySize: '10gb',
    serverActions: {
      bodySizeLimit: '10gb',
      
    },
  },
}

export default nextConfig