import { NextRequest, NextResponse } from 'next/server';
import { MAP_SIGNALS } from '@/map/MapData';
import { buildSquareLocationFromSignal } from '@/lib/buildSquareLocation';
import { saveIntersection } from '@/lib/savedIntersections';
import { getSignalWithCoordinates, saveSignalCoordinates } from '@/lib/mapSignalCoordinates';
import type { LatLng, SquareLocation, SquareWay } from '@/map/squareLocations';
import { invalidateSquareCache, setSquareCache } from '@/lib/squareCache';

export const runtime = 'nodejs';

interface SavePayload {
  signalId?: string;
  lat?: number;
  lng?: number;
  ways?: Array<{
    id?: string;
    bearing?: number;
    coordinates?: LatLng[];
    color?: string;
  }>;
}

function isValidWay(way: SavePayload['ways'] extends (infer W)[] | undefined ? W : never): boolean {
  return (
    typeof way.id === 'string' &&
    typeof way.bearing === 'number' &&
    Array.isArray(way.coordinates) &&
    way.coordinates.length >= 2 &&
    way.coordinates.every(
      (coord) =>
        Array.isArray(coord) &&
        coord.length === 2 &&
        typeof coord[0] === 'number' &&
        typeof coord[1] === 'number',
    ) &&
    typeof way.color === 'string'
  );
}

export async function POST(req: NextRequest) {
  let body: SavePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { signalId, lat, lng, ways } = body;

  if (!signalId || typeof lat !== 'number' || typeof lng !== 'number' || !Array.isArray(ways)) {
    return NextResponse.json(
      { error: 'signalId, lat, lng, and ways are required' },
      { status: 400 },
    );
  }

  if (ways.length < 1 || ways.length > 8) {
    return NextResponse.json({ error: 'Intersections must have 1–8 ways' }, { status: 400 });
  }

  if (!ways.every(isValidWay)) {
    return NextResponse.json({ error: 'Each way must include id, bearing, coordinates, color' }, { status: 400 });
  }

  const signal = await getSignalWithCoordinates(signalId, MAP_SIGNALS);
  if (!signal) {
    return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
  }

  const normalizedWays: SquareWay[] = ways.map((way) => ({
    id: way.id!,
    bearing: way.bearing!,
    coordinates: way.coordinates as LatLng[],
    color: way.color!,
    labelPosition: way.coordinates![1] as LatLng,
  }));

  await saveIntersection({
    signalId,
    lat,
    lng,
    ways: normalizedWays.map(({ id, bearing, coordinates, color }) => ({
      id,
      bearing,
      coordinates,
      color,
    })),
    updatedAt: new Date().toISOString(),
  });

  const updatedCoords = await saveSignalCoordinates(signalId, lat, lng);

  invalidateSquareCache(signalId);

  const square: SquareLocation = buildSquareLocationFromSignal(signal, lat, lng, normalizedWays, {
    isSaved: true,
    snapped: true,
  });

  setSquareCache(signalId, square);

  return NextResponse.json({
    ...square,
    originalLat: updatedCoords.lat,
    originalLng: updatedCoords.lng,
    updatedCoordinates: updatedCoords,
  });
}
