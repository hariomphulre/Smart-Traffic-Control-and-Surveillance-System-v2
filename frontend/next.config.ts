import type { NextConfig } from 'next'

const backendInternal =
  process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001'
const mlInternal = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000'

/** Backend API prefixes (simulation + videos are handled by Next.js routes). */
const backendApiPrefixes = [
  'logs',
  'challans',
  'accidents',
  'images',
  'analytics',
  'ambulance',
  'signals',
] as const

const nextConfig: NextConfig = {
  reactStrictMode: false,
  async rewrites() {
    const rules: { source: string; destination: string }[] = []

    for (const prefix of backendApiPrefixes) {
      rules.push({
        source: `/api/${prefix}`,
        destination: `${backendInternal}/api/${prefix}`,
      })
      rules.push({
        source: `/api/${prefix}/:path*`,
        destination: `${backendInternal}/api/${prefix}/:path*`,
      })
    }

    rules.push({
      source: '/streams/:path*',
      destination: `${mlInternal}/streams/:path*`,
    })

    return rules
  },
}

export default nextConfig
