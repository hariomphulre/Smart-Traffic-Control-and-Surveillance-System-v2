import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

const VIDEOS_DIR = path.join(process.cwd(), '..', 'ml_service', 'videos')

export async function GET() {
  try {
    // Ensure videos directory exists
    if (!fs.existsSync(VIDEOS_DIR)) {
      return NextResponse.json({ videos: [] })
    }

    // Read all files in the videos directory
    const files = fs.readdirSync(VIDEOS_DIR)

    // Filter for video files (mp4, webm, mov, avi, etc.)
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v']
    const videos = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase()
        return videoExtensions.includes(ext)
      })
      .map((file) => ({
        id: file.replace(/\.[^/.]+$/, ''),
        label: file,
        file: file,
      }))
      .sort((a, b) => a.file.localeCompare(b.file))

    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Error reading videos directory:', error)
    return NextResponse.json({ error: 'Unable to read videos directory', videos: [] }, { status: 500 })
  }
}
