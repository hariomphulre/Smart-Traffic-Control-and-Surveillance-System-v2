import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v']

function isValidVideoFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ALLOWED_VIDEO_EXTENSIONS.includes(ext)
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ file: string }> }
) {
  const { file } = await context.params
  const decoded = decodeURIComponent(file)

  // Validate the filename doesn't contain path traversal attempts
  if (decoded.includes('..') || decoded.includes('/') || decoded.includes('\\')) {
    return NextResponse.json({ error: 'Invalid video file' }, { status: 400 })
  }

  // Validate file extension
  if (!isValidVideoFile(decoded)) {
    return NextResponse.json({ error: 'Invalid video file type' }, { status: 400 })
  }

  const upstream = await fetch(`${ML_SERVICE_URL}/video-files/${encodeURIComponent(decoded)}`, {
    headers: request.headers.get('range')
      ? {
          Range: request.headers.get('range') as string,
        }
      : undefined,
    cache: 'no-store',
  })

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Video not found' }, { status: upstream.status || 404 })
  }

  const headers = new Headers()
  const passthrough = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'cache-control']
  for (const key of passthrough) {
    const value = upstream.headers.get(key)
    if (value) headers.set(key, value)
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  })
}
