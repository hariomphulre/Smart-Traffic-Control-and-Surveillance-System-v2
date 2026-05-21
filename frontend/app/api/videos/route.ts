import { NextResponse } from 'next/server'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/videos`, { cache: 'no-store' })
    const data = (await response.json()) as { videos?: string[] }
    if (!response.ok) {
      return NextResponse.json({ videos: [] }, { status: response.status })
    }

    const videos = (data.videos || [])
      .map((file) => ({
        id: file.replace(/\.[^/.]+$/, ''),
        label: file,
        file,
      }))
      .sort((a, b) => a.file.localeCompare(b.file))

    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Error fetching videos from ml service:', error)
    return NextResponse.json({ error: 'Unable to fetch videos', videos: [] }, { status: 500 })
  }
}
