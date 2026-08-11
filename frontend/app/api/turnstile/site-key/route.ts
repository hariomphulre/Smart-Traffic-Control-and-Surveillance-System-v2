import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Site keys are public by design. Exposed at runtime so Docker/VPS .env
 * can change without rebuilding the Next.js client bundle.
 */
export async function GET() {
  // Prefer TURNSTILE_SITE_KEY — NEXT_PUBLIC_* is inlined at build time and
  // will be empty in prebuilt GHCR images unless passed as a Docker build-arg.
  const siteKey = process.env.TURNSTILE_SITE_KEY || ''

  return NextResponse.json(
    { siteKey },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
