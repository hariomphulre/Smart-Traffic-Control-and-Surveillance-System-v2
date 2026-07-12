import type { LatLng } from '@/map/squareLocations';

const EARTH_RADIUS_M = 6378137;

const ROAD_HIGHWAY_TYPES = new Set([
  'motorway',
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'unclassified',
  'residential',
  'living_street',
  'service',
  'tertiary_link',
  'secondary_link',
  'primary_link',
  'trunk_link',
  'motorway_link',
]);

const LOW_PRIORITY_HIGHWAYS = new Set([
  'service',
  'tertiary_link',
  'secondary_link',
  'primary_link',
  'trunk_link',
  'motorway_link',
]);

const HIGHWAY_PRIORITY: Record<string, number> = {
  motorway: 10,
  trunk: 9,
  primary: 8,
  secondary: 7,
  tertiary: 6,
  unclassified: 5,
  residential: 4,
  living_street: 3,
  service: 1,
  motorway_link: 2,
  trunk_link: 2,
  primary_link: 2,
  secondary_link: 2,
  tertiary_link: 2,
};

const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const OVERPASS_FETCH_TIMEOUT_MS = 14_000;

/** Primary fetch radius — tight enough to avoid unrelated nearby roads */
const OVERPASS_RADIUS_M = 75;
/** Single fallback when the primary query returns nothing */
const OVERPASS_FALLBACK_RADIUS_M = 110;

const JUNCTION_SEARCH_M = 70;
const SIGNAL_SNAP_M = 55;
/** Ways must pass through a node this close to the snapped center */
const CENTER_NODE_M = 10;
const CENTER_NODE_RELAXED_M = 16;
/** Merge nearby OSM nodes when scoring junction candidates */
const JUNCTION_NODE_MERGE_M = 8;
const ARM_WALK_M = 85;
const MIN_ARM_REACH_M = 22;
const STABLE_BEARING_M = 28;
const SAME_APPROACH_DEG = 28;
const PARALLEL_CARRIAGEWAY_DEG = 22;
const SERVICE_SUPPRESS_DEG = 38;
const MAX_REASONABLE_WAYS = 6;

/** Main roads only in Overpass — excludes service/paths to reduce noise and latency */
const OVERPASS_HIGHWAY_FILTER =
  '^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street)(|_link)$';

export interface OSMNode {
  lat: number;
  lon: number;
}

export interface OSMWay {
  id: number;
  nodes: OSMNode[];
  highway?: string;
  name?: string;
  ref?: string;
}

export interface DetectedArm {
  bearing: number;
  coordinates: LatLng[];
}

interface RawArm {
  bearing: number;
  coordinates: LatLng[];
  wayId: number;
  name?: string;
  ref?: string;
  highway?: string;
  priority: number;
  reachM: number;
}

interface OSMFetchResult {
  ways: OSMWay[];
  trafficSignals: Array<{ lat: number; lon: number }>;
}

export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function destinationPoint(
  lat: number,
  lng: number,
  bearingDegVal: number,
  distanceM: number,
): LatLng {
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const θ = (bearingDegVal * Math.PI) / 180;
  const δ = distanceM / EARTH_RADIUS_M;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ),
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
    );

  return [(φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI];
}

function normalizeBearing(b: number): number {
  return ((b % 360) + 360) % 360;
}

function angularDiff(a: number, b: number): number {
  const d = Math.abs(normalizeBearing(a) - normalizeBearing(b));
  return Math.min(d, 360 - d);
}

function highwayPriority(highway?: string): number {
  if (!highway) return 0;
  return HIGHWAY_PRIORITY[highway] ?? 0;
}

function roadLabel(way: Pick<OSMWay, 'name' | 'ref'>): string | undefined {
  const name = way.name?.trim();
  if (name) return name.toLowerCase();
  const ref = way.ref?.trim();
  if (ref) return `ref:${ref.toLowerCase()}`;
  return undefined;
}

function parseOSMResponse(data: {
  elements?: Array<{
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    geometry?: Array<{ lat: number; lon: number }>;
    tags?: { highway?: string; name?: string; ref?: string };
  }>;
}): OSMFetchResult {
  const ways: OSMWay[] = [];
  const trafficSignals: Array<{ lat: number; lon: number }> = [];

  for (const el of data.elements ?? []) {
    if (el.type === 'node' && el.lat != null && el.lon != null) {
      trafficSignals.push({ lat: el.lat, lon: el.lon });
      continue;
    }

    if (
      el.type !== 'way' ||
      !el.geometry ||
      el.geometry.length < 2 ||
      !el.tags?.highway ||
      !ROAD_HIGHWAY_TYPES.has(el.tags.highway)
    ) {
      continue;
    }

    ways.push({
      id: el.id,
      nodes: el.geometry.map((g) => ({ lat: g.lat, lon: g.lon })),
      highway: el.tags.highway,
      name: el.tags.name,
      ref: el.tags.ref,
    });
  }

  return { ways, trafficSignals };
}

async function queryOverpass(query: string): Promise<OSMFetchResult> {
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'signal-x/1.0 (intersection analysis)',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(OVERPASS_FETCH_TIMEOUT_MS),
      });

      if (!res.ok) {
        lastError = new Error(`Overpass API error: ${res.status}`);
        continue;
      }

      const json = await res.json();
      return parseOSMResponse(json);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Overpass request failed');
    }
  }

  throw lastError ?? new Error('Overpass API unavailable');
}

export async function fetchOSMData(
  lat: number,
  lng: number,
  radiusM = OVERPASS_RADIUS_M,
): Promise<OSMFetchResult> {
  const signalRadius = Math.min(radiusM, 50);
  const query = `[out:json][timeout:12];(way(around:${radiusM},${lat},${lng})["highway"~"${OVERPASS_HIGHWAY_FILTER}"];node(around:${signalRadius},${lat},${lng})["highway"="traffic_signals"];);out geom;`;
  return queryOverpass(query);
}

/** @deprecated use fetchOSMData */
export async function fetchOSMWays(lat: number, lng: number, radiusM = OVERPASS_RADIUS_M): Promise<OSMWay[]> {
  const { ways } = await fetchOSMData(lat, lng, radiusM);
  return ways;
}

interface JunctionCandidate {
  lat: number;
  lng: number;
  wayIds: Set<number>;
  score: number;
}

/** Keep only ways that actually pass through the intersection center node */
function waysAtJunction(
  centerLat: number,
  centerLng: number,
  ways: OSMWay[],
  toleranceM = CENTER_NODE_M,
): OSMWay[] {
  return ways.filter((way) =>
    way.nodes.some((node) => haversineM(centerLat, centerLng, node.lat, node.lon) <= toleranceM),
  );
}

function collectJunctionCandidates(
  lat: number,
  lng: number,
  ways: OSMWay[],
  searchRadiusM: number,
): JunctionCandidate[] {
  type NodeGroup = { lat: number; lng: number; wayIds: Set<number>; dist: number };
  const groups: NodeGroup[] = [];

  for (const way of ways) {
    for (const node of way.nodes) {
      const dist = haversineM(lat, lng, node.lat, node.lon);
      if (dist > searchRadiusM) continue;

      let merged = false;
      for (const group of groups) {
        if (haversineM(group.lat, group.lng, node.lat, node.lon) <= JUNCTION_NODE_MERGE_M) {
          group.wayIds.add(way.id);
          if (dist < group.dist) {
            group.dist = dist;
            group.lat = node.lat;
            group.lng = node.lon;
          }
          merged = true;
          break;
        }
      }

      if (!merged) {
        groups.push({
          lat: node.lat,
          lng: node.lon,
          wayIds: new Set([way.id]),
          dist,
        });
      }
    }
  }

  return groups
    .filter((group) => group.wayIds.size >= 2)
    .map((group) => ({
      lat: group.lat,
      lng: group.lng,
      wayIds: group.wayIds,
      score: group.wayIds.size * 120 - group.dist * 4,
    }))
    .sort((a, b) => b.score - a.score);
}

/** Prefer OSM traffic_signals node, else highest-connectivity junction node */
export function snapToIntersectionCenter(
  lat: number,
  lng: number,
  ways: OSMWay[],
  trafficSignals: Array<{ lat: number; lon: number }> = [],
  searchRadiusM = JUNCTION_SEARCH_M,
): LatLng {
  if (trafficSignals.length > 0) {
    let bestSignal = trafficSignals[0];
    let bestDist = haversineM(lat, lng, bestSignal.lat, bestSignal.lon);
    for (const signal of trafficSignals.slice(1)) {
      const dist = haversineM(lat, lng, signal.lat, signal.lon);
      if (dist < bestDist) {
        bestDist = dist;
        bestSignal = signal;
      }
    }
    if (bestDist <= SIGNAL_SNAP_M) {
      const nearSignal = collectJunctionCandidates(
        bestSignal.lat,
        bestSignal.lon,
        ways,
        30,
      );
      if (nearSignal.length > 0 && nearSignal[0].wayIds.size >= 2) {
        return [nearSignal[0].lat, nearSignal[0].lng];
      }
      return [bestSignal.lat, bestSignal.lon];
    }
  }

  const candidates = collectJunctionCandidates(lat, lng, ways, searchRadiusM);
  if (candidates.length > 0) {
    return [candidates[0].lat, candidates[0].lng];
  }

  return [lat, lng];
}

function findJunctionNodeOnWay(
  centerLat: number,
  centerLng: number,
  way: OSMWay,
  toleranceM = CENTER_NODE_M,
): number | null {
  let bestIdx: number | null = null;
  let bestDist = Infinity;

  for (let i = 0; i < way.nodes.length; i++) {
    const node = way.nodes[i];
    const dist = haversineM(centerLat, centerLng, node.lat, node.lon);
    if (dist <= toleranceM && dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
}

function walkArmPolyline(
  centerLat: number,
  centerLng: number,
  way: OSMWay,
  startIdx: number,
  direction: 1 | -1,
  maxDistM = ARM_WALK_M,
): { coordinates: LatLng[]; reachM: number } {
  const coords: LatLng[] = [[centerLat, centerLng]];
  let accumulated = 0;
  let idx = startIdx;

  while (accumulated < maxDistM) {
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= way.nodes.length) break;

    const prev = way.nodes[idx];
    const next = way.nodes[nextIdx];
    const segLen = haversineM(prev.lat, prev.lon, next.lat, next.lon);
    accumulated += segLen;
    coords.push([next.lat, next.lon]);
    idx = nextIdx;
  }

  return { coordinates: coords, reachM: accumulated };
}

/** Stable bearing from center to a point ~28 m along the arm */
function stableArmBearing(
  centerLat: number,
  centerLng: number,
  coords: LatLng[],
): number {
  let target: LatLng | null = null;
  let accumulated = 0;

  for (let i = 1; i < coords.length; i++) {
    accumulated += haversineM(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
    if (accumulated >= STABLE_BEARING_M) {
      target = coords[i];
      break;
    }
  }

  if (!target) target = coords[coords.length - 1];
  return bearingDeg(centerLat, centerLng, target[0], target[1]);
}

/** One arm per OSM way — road centerline through the junction, not bidirectional duplicates */
function extractArmFromWay(
  centerLat: number,
  centerLng: number,
  way: OSMWay,
  junctionIdx: number,
): RawArm | null {
  const forward = walkArmPolyline(centerLat, centerLng, way, junctionIdx, 1);
  const backward = walkArmPolyline(centerLat, centerLng, way, junctionIdx, -1);

  const longer = forward.reachM >= backward.reachM ? forward : backward;
  if (longer.reachM < MIN_ARM_REACH_M || longer.coordinates.length < 2) {
    return null;
  }

  const bearing = stableArmBearing(centerLat, centerLng, longer.coordinates);

  return {
    bearing,
    coordinates: longer.coordinates,
    wayId: way.id,
    name: way.name,
    ref: way.ref,
    highway: way.highway,
    priority: highwayPriority(way.highway),
    reachM: Math.max(forward.reachM, backward.reachM),
  };
}

function extractArmsPerRoad(centerLat: number, centerLng: number, ways: OSMWay[]): RawArm[] {
  const raw: RawArm[] = [];

  for (const way of ways) {
    const junctionIdx = findJunctionNodeOnWay(centerLat, centerLng, way);
    if (junctionIdx == null) continue;

    const arm = extractArmFromWay(centerLat, centerLng, way, junctionIdx);
    if (arm) raw.push(arm);
  }

  return raw;
}

function mergeRawArms(a: RawArm, b: RawArm): RawArm {
  const primary = a.priority >= b.priority ? a : b;
  const secondary = primary === a ? b : a;
  const coords =
    a.coordinates.length >= b.coordinates.length ? a.coordinates : b.coordinates;
  const bearing = normalizeBearing((a.bearing + b.bearing) / 2);

  return {
    ...primary,
    bearing,
    coordinates: coords,
    reachM: Math.max(a.reachM, b.reachM),
    name: primary.name ?? secondary.name,
    ref: primary.ref ?? secondary.ref,
  };
}

function clusterRawArms(arms: RawArm[], thresholdDeg: number): RawArm[] {
  if (arms.length === 0) return [];

  const sorted = [...arms].sort((a, b) => b.priority - a.priority || b.reachM - a.reachM);
  const clusters: RawArm[] = [];

  for (const arm of sorted) {
    const label = roadLabel(arm);

    let merged = false;
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const clusterLabel = roadLabel(cluster);

      const sameName =
        label != null &&
        clusterLabel != null &&
        label === clusterLabel &&
        angularDiff(cluster.bearing, arm.bearing) < 45;
      const closeBearing = angularDiff(cluster.bearing, arm.bearing) < thresholdDeg;

      if (sameName || closeBearing) {
        clusters[i] = mergeRawArms(cluster, arm);
        merged = true;
        break;
      }
    }

    if (!merged) clusters.push({ ...arm });
  }

  return clusters.sort(
    (a, b) => normalizeBearing(a.bearing) - normalizeBearing(b.bearing),
  );
}

function suppressLowPriorityArms(arms: RawArm[]): RawArm[] {
  return arms.filter((arm) => {
    if (!arm.highway || !LOW_PRIORITY_HIGHWAYS.has(arm.highway)) return true;

    const dominated = arms.some((other) => {
      if (other === arm) return false;
      if (other.priority <= arm.priority) return false;
      return angularDiff(other.bearing, arm.bearing) < SERVICE_SUPPRESS_DEG;
    });

    return !dominated;
  });
}

/** Merge parallel dual-carriageway segments (same road name, similar bearing) */
function mergeParallelCarriageways(arms: RawArm[]): RawArm[] {
  const used = new Set<number>();
  const result: RawArm[] = [];

  for (let i = 0; i < arms.length; i++) {
    if (used.has(i)) continue;

    let current = arms[i];
    used.add(i);

    for (let j = i + 1; j < arms.length; j++) {
      if (used.has(j)) continue;

      const other = arms[j];
      const labelA = roadLabel(current);
      const labelB = roadLabel(other);

      const parallel =
        labelA != null &&
        labelA === labelB &&
        angularDiff(current.bearing, other.bearing) < PARALLEL_CARRIAGEWAY_DEG;

      if (parallel) {
        current = mergeRawArms(current, other);
        used.add(j);
      }
    }

    result.push(current);
  }

  return result.sort(
    (a, b) => normalizeBearing(a.bearing) - normalizeBearing(b.bearing),
  );
}

function refineArmCount(arms: RawArm[]): RawArm[] {
  let refined = arms;

  if (refined.length > MAX_REASONABLE_WAYS) {
    refined = clusterRawArms(refined, 40);
  }

  if (refined.length > MAX_REASONABLE_WAYS) {
    refined = refined
      .sort((a, b) => b.priority - a.priority || b.reachM - a.reachM)
      .slice(0, MAX_REASONABLE_WAYS)
      .sort((a, b) => normalizeBearing(a.bearing) - normalizeBearing(b.bearing));
  }

  return refined;
}

function detectArms(centerLat: number, centerLng: number, ways: OSMWay[]): DetectedArm[] {
  let raw = extractArmsPerRoad(centerLat, centerLng, ways);
  raw = suppressLowPriorityArms(raw);
  raw = clusterRawArms(raw, SAME_APPROACH_DEG);
  raw = mergeParallelCarriageways(raw);
  raw = suppressLowPriorityArms(raw);
  raw = refineArmCount(raw);

  return raw.map(({ bearing, coordinates }) => ({ bearing, coordinates }));
}

function fallbackArms(lat: number, lng: number, count = 4): DetectedArm[] {
  const bearings = count === 3 ? [0, 120, 240] : [0, 90, 180, 270];
  return bearings.map((bearing) => ({
    bearing,
    coordinates: [[lat, lng], destinationPoint(lat, lng, bearing, 70)],
  }));
}

export function buildBoundsFromArms(center: LatLng, arms: DetectedArm[], radiusM = 24): LatLng[] {
  if (arms.length === 0) {
    return [315, 45, 135, 225, 315].map((b) =>
      destinationPoint(center[0], center[1], b, radiusM * Math.SQRT2),
    );
  }

  const points = arms.map((arm) => {
    const end = arm.coordinates[arm.coordinates.length - 1];
    const dist = Math.min(haversineM(center[0], center[1], end[0], end[1]), radiusM);
    return destinationPoint(center[0], center[1], arm.bearing, dist * 0.55);
  });

  points.sort((a, b) => {
    const ba = bearingDeg(center[0], center[1], a[0], a[1]);
    const bb = bearingDeg(center[0], center[1], b[0], b[1]);
    return normalizeBearing(ba) - normalizeBearing(bb);
  });

  return [...points, points[0]];
}

export interface AnalyzedIntersection {
  center: LatLng;
  originalCenter: LatLng;
  snapped: boolean;
  ways: DetectedArm[];
  wayCount: number;
}

export async function analyzeIntersection(
  lat: number,
  lng: number,
): Promise<AnalyzedIntersection> {
  const originalCenter: LatLng = [lat, lng];

  try {
    let { ways, trafficSignals } = await fetchOSMData(lat, lng, OVERPASS_RADIUS_M);

    if (ways.length === 0) {
      ({ ways, trafficSignals } = await fetchOSMData(lat, lng, OVERPASS_FALLBACK_RADIUS_M));
    }

    const center = snapToIntersectionCenter(lat, lng, ways, trafficSignals);
    const snapped = haversineM(lat, lng, center[0], center[1]) > 5;

    let junctionWays = waysAtJunction(center[0], center[1], ways, CENTER_NODE_M);
    if (junctionWays.length < 2) {
      junctionWays = waysAtJunction(center[0], center[1], ways, CENTER_NODE_RELAXED_M);
    }

    let arms = detectArms(center[0], center[1], junctionWays);

    if (arms.length >= 2) {
      return {
        center,
        originalCenter,
        snapped,
        ways: arms,
        wayCount: arms.length,
      };
    }
  } catch (err) {
    console.warn('[intersectionAnalysis] OSM fetch failed, using fallback arms:', err);
  }

  return {
    center: originalCenter,
    originalCenter,
    snapped: false,
    ways: fallbackArms(lat, lng, 4),
    wayCount: 4,
  };
}

export const WAY_PALETTE = ['#63b3ed', '#f6ad55', '#68d391', '#b794f4', '#fc8181', '#4fd1c5'];

export function makeWayId(index: number): string {
  return `R${index + 1}`;
}

export function labelPositionAlongArm(arm: DetectedArm, center: LatLng): LatLng {
  const end = arm.coordinates[arm.coordinates.length - 1];
  const dist = haversineM(center[0], center[1], end[0], end[1]);
  const ratio = dist > 0 ? Math.min(0.72, (dist - 8) / dist) : 0.5;
  const labelDist = dist * ratio;
  return destinationPoint(center[0], center[1], arm.bearing, labelDist);
}

export function mapCardinalsToWays(
  ways: Array<{ id: string; bearing: number }>,
): Record<'north' | 'south' | 'east' | 'west', string> {
  const targets = { north: 0, east: 90, south: 180, west: 270 } as const;
  const result: Record<'north' | 'south' | 'east' | 'west', string> = {
    north: 'R1',
    east: 'R2',
    south: 'R3',
    west: 'R4',
  };

  if (ways.length === 0) return result;

  for (const [cardinal, targetBearing] of Object.entries(targets) as Array<
    [keyof typeof targets, number]
  >) {
    let best = ways[0];
    let bestDiff = Infinity;
    for (const way of ways) {
      const diff = angularDiff(way.bearing, targetBearing);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = way;
      }
    }
    result[cardinal] = best.id;
  }

  return result;
}
