import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Site keys are public by design. Exposed at runtime so Docker/VPS .env
 * can change without rebuilding the Next.js client bundle.
 */
export async function GET() {
  // TURNSTILE_SITE_KEY: Docker/runtime (compose maps NEXT_PUBLIC_* → this).
  // NEXT_PUBLIC_TURNSTILE_SITE_KEY: local `next dev` (.env.local).
  const siteKey =
    process.env.TURNSTILE_SITE_KEY ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    ''

  return NextResponse.json(
    { siteKey },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
