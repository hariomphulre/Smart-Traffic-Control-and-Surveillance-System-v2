import { NextResponse } from 'next/server'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

export async function POST() {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/simulation/pause`, {
      method: 'POST',
      cache: 'no-store',
    })
    const payload = await response.json()
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status })
    }
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json({ error: 'Unable to pause simulation', details: String(error) }, { status: 500 })
  }
}
