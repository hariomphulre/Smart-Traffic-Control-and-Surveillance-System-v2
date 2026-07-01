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
    for (const key of ['1', '2', '3', '4']) {
      const partition = status[key] || { running: false }
      if (partition.running) {
        partition.streamUrl = `/streams/partition${key}/index.m3u8`
      } else {
        delete partition.streamUrl
      }
      status[key] = partition
    }

    return NextResponse.json({
      status,
      wsUrl,
      starting: payload?.starting ?? false,
      batchStartedAt: payload?.batchStartedAt,
      signalSimulationRunning: payload?.signalSimulationRunning ?? false,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Unable to fetch simulation status', details: String(error) }, { status: 500 })
  }
}

