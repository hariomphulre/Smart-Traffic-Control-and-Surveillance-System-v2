import { NextResponse } from 'next/server'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/simulation/status`, { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status })
    }

    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      process.env.NEXT_PUBLIC_ML_WS_URL ||
      `${(process.env.NEXT_PUBLIC_ML_SERVICE_URL || ML_SERVICE_URL).replace(/^http/, 'ws').replace(/\/$/, '')}/ws/analytics`
    const status = payload?.status || {}
    for (const key of Object.keys(status)) {
      const partition = status[key]
      if (partition?.running && partition?.streamPath) {
        partition.streamUrl = `/streams/partition${key}/index.m3u8`
      } else {
        delete partition.streamUrl
      }
    }

    return NextResponse.json({
      status,
      wsUrl,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Unable to fetch simulation status', details: String(error) }, { status: 500 })
  }
}

