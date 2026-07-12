import { NextResponse } from 'next/server';
import { readCoordinateOverrides } from '@/lib/mapSignalCoordinates';

export const runtime = 'nodejs';

export async function GET() {
  const overrides = await readCoordinateOverrides();
  const payload = Object.fromEntries(
    Object.entries(overrides).map(([id, coord]) => [
      id,
      { lat: coord.lat, lng: coord.lng },
    ]),
  );

  return NextResponse.json(payload);
}
