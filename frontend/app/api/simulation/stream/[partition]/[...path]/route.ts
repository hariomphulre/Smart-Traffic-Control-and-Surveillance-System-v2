import { NextResponse } from 'next/server'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

export async function GET(
  _request: Request,
  context: { params: Promise<{ partition: string; path?: string[] }> }
) {
  const { partition, path: segments } = await context.params
  const part = Number(partition)
  if (!Number.isInteger(part) || part < 1 || part > 4) {
    return NextResponse.json({ error: 'Invalid partition' }, { status: 400 })
  }

  const segmentPath = segments?.length ? segments.join('/') : 'index.m3u8'
  const upstream = `${ML_SERVICE_URL.replace(/\/$/, '')}/streams/partition${part}/${segmentPath}`

  try {
    const response = await fetch(upstream, { cache: 'no-store' })
    const contentType =
      response.headers.get('content-type') ||
      (segmentPath.endsWith('.m3u8')
        ? 'application/vnd.apple.mpegurl'
        : 'video/mp2t')

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Stream proxy failed', details: String(error) },
      { status: 502 }
    )
  }
}
