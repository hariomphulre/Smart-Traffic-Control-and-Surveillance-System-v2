import type { AnalyticsWay } from '@/map/squareLocations';

export interface TrafficTimeRow {
  time: string;
  overall: number;
  [wayId: string]: string | number;
}

export interface AnalyticsWayWithTraffic extends AnalyticsWay {
  vehicleCount: number;
}

export interface AnalyticsTrafficData {
  /** Per-way rows — same numbers shown in Total Vehicles header */
  ways: AnalyticsWayWithTraffic[];
  /** Current vehicle count per way — drives map strip color */
  byWay: Record<string, number>;
  /** Sum of per-way counts (header total) */
  total: number;
  /** Time series for the traffic volume chart */
  timeSeries: TrafficTimeRow[];
}

const DEMO_MIN_VEHICLES = 1;
const DEMO_MAX_VEHICLES = 25;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function hashLocationSeed(locationKey: string, seed = 0): number {
  let hash = seed >>> 0;
  for (let i = 0; i < locationKey.length; i += 1) {
    hash = (hash * 31 + locationKey.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Demo per-way counts (1–25) — regenerated when location path or refresh seed changes */
export function generateDemoWayVehicleCounts(
  activeWays: AnalyticsWay[],
  seed = 0,
): Record<string, number> {
  if (activeWays.length === 0) return {};

  const rand = seededRandom(seed);
  const counts: Record<string, number> = {};

  for (const way of activeWays) {
    counts[way.id] =
      Math.floor(rand() * (DEMO_MAX_VEHICLES - DEMO_MIN_VEHICLES + 1)) +
      DEMO_MIN_VEHICLES;
  }

  return counts;
}

export function generateTrafficTimeSeries(
  activeWays: AnalyticsWay[],
  byWay: Record<string, number>,
  seed = 0,
): TrafficTimeRow[] {
  const rand = seededRandom(seed + 17);
  const data: TrafficTimeRow[] = [];
  const startTime = new Date();
  startTime.setHours(13, 45, 0, 0);
  const pointCount = 181;

  for (let index = 0; index < pointCount; index += 1) {
    const isSpike = index > 120 && index < 150;
    const isLatest = index === pointCount - 1;
    const row: TrafficTimeRow = {
      time: startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }),
      overall: 0,
    };

    let overall = 0;
    activeWays.forEach((way, wayIndex) => {
      const current = byWay[way.id] ?? 0;
      let value: number;

      if (isLatest) {
        value = current;
      } else if (isSpike) {
        value = Math.max(
          0,
          Math.round(current * (1.4 + rand() * 0.8) + wayIndex),
        );
      } else {
        value = Math.max(
          0,
          Math.round(current * (0.55 + rand() * 0.35)),
        );
      }

      row[way.id] = value;
      overall += value;
    });

    row.overall = overall;
    data.push(row);
    startTime.setSeconds(startTime.getSeconds() + 15);
  }

  return data;
}

export function buildAnalyticsTrafficData(
  activeWays: AnalyticsWay[],
  options?: { seed?: number; locationKey?: string },
): AnalyticsTrafficData {
  const trafficSeed = hashLocationSeed(options?.locationKey ?? 'default', options?.seed ?? 0);
  const byWay = generateDemoWayVehicleCounts(activeWays, trafficSeed);
  const ways: AnalyticsWayWithTraffic[] = activeWays.map((way) => ({
    ...way,
    vehicleCount: byWay[way.id] ?? 0,
  }));
  const total = ways.reduce((sum, way) => sum + way.vehicleCount, 0);
  const timeSeries = generateTrafficTimeSeries(activeWays, byWay, trafficSeed);

  return { ways, byWay, total, timeSeries };
}

/** Look up the exact header count for a map way — no fallback substitution */
export function getHeaderWayVehicleCount(
  wayId: string,
  byWay: Record<string, number>,
): number {
  return byWay[wayId] ?? 0;
}
