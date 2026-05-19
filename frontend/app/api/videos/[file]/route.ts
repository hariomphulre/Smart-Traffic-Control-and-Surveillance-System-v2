import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const VIDEOS_DIR = path.join(process.cwd(), '..', 'ml_service', 'videos')
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

  const filePath = path.join(VIDEOS_DIR, decoded)
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  const stat = fs.statSync(filePath)
  const fileSize = stat.size
  const range = request.headers.get('range')

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunkSize = end - start + 1

    const stream = fs.createReadStream(filePath, { start, end })
    const readable = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk))
        stream.on('end', () => controller.close())
        stream.on('error', (err) => controller.error(err))
      },
    })

    return new NextResponse(readable, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': 'video/mp4',
      },
    })
  }

  const stream = fs.createReadStream(filePath)
  const readable = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => controller.enqueue(chunk))
      stream.on('end', () => controller.close())
      stream.on('error', (err) => controller.error(err))
    },
  })

  return new NextResponse(readable, {
    headers: {
      'Content-Length': String(fileSize),
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    },
  })
}
