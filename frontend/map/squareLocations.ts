import { MAP_SIGNALS, type MapSignal } from './MapData';
import { destinationPoint, mapCardinalsToWays } from '@/lib/intersectionAnalysis';

export type CardinalDirection = 'north' | 'south' | 'east' | 'west';

/** Dynamic way id: R1, R2, R3, … based on actual intersection arms */
export type WayId = string;

export type LatLng = [number, number];

export interface SquareWay {
  id: WayId;
  bearing: number;
  coordinates: LatLng[];
  labelPosition: LatLng;
  color: string;
}

export interface SquareLocation {
  signalId: string;
  name: string;
  path: string[];
  /** Snapped intersection center */
  lat: number;
  lng: number;
  originalLat?: number;
  originalLng?: number;
  snapped?: boolean;
  /** True when layout was manually saved (skips OSM on future loads) */
  isSaved?: boolean;
  wayCount: number;
  intersectionBounds: LatLng[];
  ways: SquareWay[];
  /** Maps analytics N/E/S/W to nearest actual way label */
  cardinalLabels: Record<CardinalDirection, string>;
}

export interface WayLabels {
  north: string;
  south: string;
  east: string;
  west: string;
}

export const FALLBACK_WAY_LABELS: WayLabels = {
  north: 'R1',
  east: 'R2',
  south: 'R3',
  west: 'R4',
};

/** One analytics row per actual intersection way (R1…Rn) */
export interface AnalyticsWay {
  id: string;
  label: string;
  color: string;
}

const FALLBACK_ANALYTICS_WAYS: AnalyticsWay[] = [
  { id: 'R1', label: 'R1', color: '#63b3ed' },
  { id: 'R2', label: 'R2', color: '#f6ad55' },
  { id: 'R3', label: 'R3', color: '#68d391' },
  { id: 'R4', label: 'R4', color: '#b794f4' },
];

const WAY_COUNT_WEIGHTS = [0.3, 0.25, 0.2, 0.25, 0.18, 0.16, 0.14, 0.12];
const WAY_WAIT_MULTIPLIERS = [1.2, 1.5, 0.9, 0.8, 0.85, 0.95, 1.0, 1.1];
const WAY_QUEUE_MULTIPLIERS = [1.1, 1.3, 0.8, 0.9, 0.95, 1.05, 0.85, 0.75];

/** Ways that exist on the current square — drives all analytics R-label UI */
export function getAnalyticsWays(square: SquareLocation | null): AnalyticsWay[] {
  if (square?.ways?.length) {
    return square.ways.map((way) => ({
      id: way.id,
      label: way.id,
      color: way.color,
    }));
  }
  return FALLBACK_ANALYTICS_WAYS;
}

export function getActiveWayIdSet(square: SquareLocation | null): Set<string> {
  return new Set(getAnalyticsWays(square).map((way) => way.id));
}

/** Split a total across active ways using stable weights */
export function distributeMetricAcrossWays(
  total: number,
  wayIndex: number,
  wayCount: number,
): number {
  if (wayCount <= 0) return 0;
  const weights = Array.from(
    { length: wayCount },
    (_, i) => WAY_COUNT_WEIGHTS[i] ?? 1 / wayCount,
  );
  const sum = weights.reduce((acc, w) => acc + w, 0);
  return Math.floor(total * (weights[wayIndex] / sum));
}

export function wayWaitMultiplier(wayIndex: number): number {
  return WAY_WAIT_MULTIPLIERS[wayIndex] ?? 1;
}

export function wayQueueMultiplier(wayIndex: number): number {
  return WAY_QUEUE_MULTIPLIERS[wayIndex] ?? 1;
}

export { destinationPoint };

export function getSignalByPath(pathSegments: string[]): MapSignal | null {
  if (pathSegments.length < 4) return null;
  const byPath = MAP_SIGNALS.find((s) => s.path.join('/') === pathSegments.join('/'));
  if (byPath) return byPath;
  return MAP_SIGNALS.find((s) => s.id === pathSegments[pathSegments.length - 1]) ?? null;
}

export function getSignalIdFromPath(pathSegments: string[]): string | null {
  const signal = getSignalByPath(pathSegments);
  return signal?.id ?? null;
}

/** Fetch OSM-analyzed square for a signal (server-side Overpass + cache) */
export async function resolveSquareLocation(pathSegments: string[]): Promise<SquareLocation | null> {
  const signalId = getSignalIdFromPath(pathSegments);
  if (!signalId) return null;

  const pathKey = pathSegments.join('/');
  const res = await fetch(
    `/api/intersection/analyze?signalId=${encodeURIComponent(signalId)}&path=${encodeURIComponent(pathKey)}`,
  );

  if (!res.ok) return null;
  return res.json() as Promise<SquareLocation>;
}

/** Persist a manually edited square layout for a signal */
export async function saveSquareLocation(
  square: Pick<SquareLocation, 'signalId' | 'lat' | 'lng' | 'ways'>,
): Promise<SquareLocation> {
  const res = await fetch('/api/intersection/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signalId: square.signalId,
      lat: square.lat,
      lng: square.lng,
      ways: square.ways.map(({ id, bearing, coordinates, color }) => ({
        id,
        bearing,
        coordinates,
        color,
      })),
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to save intersection layout');
  }

  return res.json() as Promise<SquareLocation & { updatedCoordinates?: { lat: number; lng: number } }>;
}

export function getWayLabels(square: SquareLocation | null): WayLabels {
  if (!square?.cardinalLabels) return FALLBACK_WAY_LABELS;
  return square.cardinalLabels;
}

export function getWayLabel(square: SquareLocation | null, cardinal: CardinalDirection): string {
  return getWayLabels(square)[cardinal];
}

export function formatWayList(
  square: SquareLocation | null,
  cardinals: CardinalDirection[],
): string {
  const activeIds = getActiveWayIdSet(square);
  const labels = getWayLabels(square);
  const seen = new Set<string>();

  return cardinals
    .map((c) => labels[c])
    .filter((label) => {
      if (!activeIds.has(label) || seen.has(label)) return false;
      seen.add(label);
      return true;
    })
    .join(', ');
}

/** @deprecated use resolveSquareLocation — sync lookup only checks signal exists */
export function getSquareByPath(pathSegments: string[]): SquareLocation | null {
  const signal = getSignalByPath(pathSegments);
  if (!signal) return null;
  return null;
}

export const DEFAULT_WAY_LABELS = FALLBACK_WAY_LABELS;
