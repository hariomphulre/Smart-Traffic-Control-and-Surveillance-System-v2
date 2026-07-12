import { NextRequest, NextResponse } from 'next/server';
import { MAP_SIGNALS } from '@/map/MapData';
import {
  analyzeIntersection,
  buildBoundsFromArms,
  destinationPoint,
  labelPositionAlongArm,
  makeWayId,
  mapCardinalsToWays,
  WAY_PALETTE,
} from '@/lib/intersectionAnalysis';
import { buildSquareLocationFromSignal } from '@/lib/buildSquareLocation';
import type { SquareLocation } from '@/map/squareLocations';
import { getIntersectionOverride } from '@/map/intersectionOverrides';
import { getSavedIntersection } from '@/lib/savedIntersections';
import { getSignalWithCoordinates } from '@/lib/mapSignalCoordinates';
import {
  getSquareCache,
  setSquareCache,
} from '@/lib/squareCache';

export const runtime = 'nodejs';

function signalToBase(signalId: string) {
  return MAP_SIGNALS.find((s) => s.id === signalId) ?? null;
}

async function resolveSignal(signalId: string) {
  return getSignalWithCoordinates(signalId, MAP_SIGNALS);
}

async function buildSquareLocation(
  signalId: string,
  options: { force?: boolean; forceOsm?: boolean } = {},
): Promise<SquareLocation | null> {
  const { force = false, forceOsm = false } = options;

  if (!force && !forceOsm) {
    const cached = getSquareCache(signalId);
    if (cached) return cached;
  }

  const signal = await resolveSignal(signalId);
  if (!signal) return null;

  if (!forceOsm) {
    const saved = await getSavedIntersection(signalId);
    if (saved) {
      const square = buildSquareLocationFromSignal(
        signal,
        saved.lat,
        saved.lng,
        saved.ways,
        { isSaved: true, snapped: true },
      );
      setSquareCache(signalId, square);
      return square;
    }
  }

  const override = getIntersectionOverride(signalId);
  const analyzed = override
    ? {
        center: override.center ?? ([signal.lat, signal.lng] as [number, number]),
        originalCenter: [signal.lat, signal.lng] as [number, number],
        snapped: override.center != null,
        ways: override.ways.map((way) => ({
          bearing: way.bearing,
          coordinates: [
            override.center ?? [signal.lat, signal.lng],
            destinationPoint(
              (override.center ?? [signal.lat, signal.lng])[0],
              (override.center ?? [signal.lat, signal.lng])[1],
              way.bearing,
              75,
            ),
          ] as [number, number][],
        })),
        wayCount: override.ways.length,
      }
    : await analyzeIntersection(signal.lat, signal.lng);

  const center = analyzed.center;

  const ways = analyzed.ways.map((arm, index) => {
    const id = makeWayId(index);
    return {
      id,
      bearing: arm.bearing,
      coordinates: arm.coordinates,
      labelPosition: labelPositionAlongArm(arm, center),
      color: WAY_PALETTE[index % WAY_PALETTE.length],
    };
  });

  const square: SquareLocation = {
    signalId: signal.id,
    name: signal.path[signal.path.length - 2] ?? signal.id,
    path: signal.path,
    lat: center[0],
    lng: center[1],
    originalLat: signal.lat,
    originalLng: signal.lng,
    snapped: analyzed.snapped,
    wayCount: ways.length,
    intersectionBounds: buildBoundsFromArms(center, analyzed.ways),
    ways,
    cardinalLabels: mapCardinalsToWays(ways),
  };

  setSquareCache(signalId, square);
  return square;
}

export async function GET(req: NextRequest) {
  const signalId = req.nextUrl.searchParams.get('signalId');
  const pathKey = req.nextUrl.searchParams.get('path');

  if (!signalId && !pathKey) {
    return NextResponse.json({ error: 'signalId or path required' }, { status: 400 });
  }

  let id = signalId;
  if (!id && pathKey) {
    const segments = pathKey.split('/');
    id = segments[segments.length - 1];
  }

  if (!id) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const refresh = req.nextUrl.searchParams.get('refresh') === 'true';
    const forceOsm = req.nextUrl.searchParams.get('forceOsm') === 'true';
    const square = await buildSquareLocation(id, { force: refresh, forceOsm });
    if (!square) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }
    return NextResponse.json(square);
  } catch (err) {
    console.error('[intersection/analyze]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 502 },
    );
  }
}

/** Batch analyze all signals — call with ?all=true (slow, rate-limited) */
export async function POST(req: NextRequest) {
  const { prewarm } = await req.json().catch(() => ({}));

  if (!prewarm) {
    return NextResponse.json({ error: 'Set prewarm: true' }, { status: 400 });
  }

  const results: Array<{ id: string; ok: boolean; wayCount?: number; error?: string }> = [];

  for (const signal of MAP_SIGNALS) {
    try {
      const square = await buildSquareLocation(signal.id);
      results.push({ id: signal.id, ok: !!square, wayCount: square?.wayCount });
      await new Promise((r) => setTimeout(r, 1200));
    } catch (err) {
      results.push({
        id: signal.id,
        ok: false,
        error: err instanceof Error ? err.message : 'failed',
      });
    }
  }

  return NextResponse.json({
    analyzed: results.filter((r) => r.ok).length,
    total: MAP_SIGNALS.length,
    results,
  });
}
