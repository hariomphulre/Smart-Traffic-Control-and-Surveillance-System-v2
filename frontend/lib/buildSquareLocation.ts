import {
  bearingDeg,
  buildBoundsFromArms,
  labelPositionAlongArm,
  makeWayId,
  mapCardinalsToWays,
  WAY_PALETTE,
  type DetectedArm,
} from '@/lib/intersectionAnalysis';
import type { LatLng, SquareLocation, SquareWay } from '@/map/squareLocations';
import type { MapSignal } from '@/map/MapData';

export function normalizeSquareWays(
  lat: number,
  lng: number,
  ways: SquareWay[],
): SquareWay[] {
  const center: LatLng = [lat, lng];

  return ways.map((way, index) => {
    const end = way.coordinates[way.coordinates.length - 1] ?? [lat, lng];
    const coordinates: LatLng[] = [[lat, lng], end];
    const bearing = bearingDeg(lat, lng, end[0], end[1]);
    const arm: DetectedArm = { bearing, coordinates };

    return {
      id: way.id || makeWayId(index),
      bearing,
      coordinates,
      labelPosition: labelPositionAlongArm(arm, center),
      color: way.color ?? WAY_PALETTE[index % WAY_PALETTE.length],
    };
  });
}

export function buildSquareLocationFromSignal(
  signal: MapSignal,
  lat: number,
  lng: number,
  ways: SquareWay[],
  options?: {
    snapped?: boolean;
    isSaved?: boolean;
  },
): SquareLocation {
  const normalizedWays = normalizeSquareWays(lat, lng, ways);
  const center: LatLng = [lat, lng];
  const arms: DetectedArm[] = normalizedWays.map((way) => ({
    bearing: way.bearing,
    coordinates: way.coordinates,
  }));

  return {
    signalId: signal.id,
    name: signal.path[signal.path.length - 2] ?? signal.id,
    path: signal.path,
    lat,
    lng,
    originalLat: signal.lat,
    originalLng: signal.lng,
    snapped: options?.snapped ?? false,
    isSaved: options?.isSaved ?? false,
    wayCount: normalizedWays.length,
    intersectionBounds: buildBoundsFromArms(center, arms),
    ways: normalizedWays,
    cardinalLabels: mapCardinalsToWays(normalizedWays),
  };
}
