import type { Intersection, POI, RoadSegment, DirectionSignal, SignalColor } from '../types.js'
import type { VehicleType } from '../types.js'
import { SIGNAL_CYCLE } from '../traffic/signalCycles.js'

/** Central New Delhi */
export const MAP_CENTER: [number, number] = [77.209, 28.6139]

/** One hospital (south / bottom of map) */
export const MAIN_HOSPITAL: POI = {
  id: 'hospital-main',
  name: 'City Hospital',
  type: 'hospital',
  lat: 28.568,
  lng: 77.207,
}

/** One fire station (north / top of map) */
export const MAIN_FIRE_STATION: POI = {
  id: 'fire-main',
  name: 'Central Fire Station',
  type: 'fire-station',
  lat: 28.651,
  lng: 77.208,
}

export const POIS: POI[] = [MAIN_HOSPITAL, MAIN_FIRE_STATION]

/** North end start node / south end start node */
const START_NORTH = 'int-karol'
const START_SOUTH = 'int-safdarjung'

export function getMissionSetup(type: VehicleType): {
  targetPoi: POI
  startNodeId: string
} {
  if (type === 'ambulance') {
    return {
      targetPoi: MAIN_HOSPITAL,
      startNodeId: START_NORTH,
    }
  }
  return {
    targetPoi: MAIN_FIRE_STATION,
    startNodeId: START_SOUTH,
  }
}

/** Coordinated signal: north–south one phase, east–west opposite */
function signalPair(stagger: number): {
  north: DirectionSignal
  south: DirectionSignal
  east: DirectionSignal
  west: DirectionSignal
} {
  const nsGreen = stagger % 2 === 0
  const nsState: SignalColor = nsGreen ? 'green' : 'red'
  const ewState: SignalColor = nsGreen ? 'red' : 'green'

  const mk = (state: SignalColor, offset: number): DirectionSignal => {
    const cycle = SIGNAL_CYCLE[state]
    return {
      state,
      countdown: Math.max(1, cycle - (offset % cycle)),
      defaultCycle: cycle,
    }
  }

  const north = mk(nsState, stagger)
  const east = mk(ewState, stagger + 7)
  return {
    north,
    south: { ...north },
    east,
    west: { ...east },
  }
}

function createIntersection(
  id: string,
  name: string,
  lat: number,
  lng: number,
  trafficDensity: number,
  congestionTrend: number,
  phaseBase: number
): Intersection {
  const signals = signalPair(phaseBase)
  return {
    id,
    name,
    lat,
    lng,
    ...signals,
    trafficDensity,
    congestionScore: Math.min(100, trafficDensity * (0.9 + Math.random() * 0.15)),
    congestionTrend,
    overrideActive: false,
    greenCorridorActive: false,
  }
}

export const INITIAL_INTERSECTIONS: Intersection[] = [
  createIntersection('int-cp', 'Connaught Place', 28.6315, 77.2167, 45, 0.1, 0),
  createIntersection('int-rajiv', 'Rajiv Chowk', 28.6328, 77.2195, 72, 0.3, 2),
  createIntersection('int-barakhamba', 'Barakhamba Road', 28.628, 77.222, 58, 0.15, 4),
  createIntersection('int-ito', 'ITO Crossing', 28.6285, 77.241, 81, 0.4, 6),
  createIntersection('int-india-gate', 'India Gate Circle', 28.6129, 77.2295, 38, -0.05, 8),
  createIntersection('int-mandi', 'Mandi House', 28.625, 77.234, 52, 0.08, 10),
  createIntersection('int-janpath', 'Janpath Crossing', 28.6275, 77.211, 41, 0.02, 12),
  createIntersection('int-rashtrapati', 'Rashtrapati Bhavan Rd', 28.6145, 77.199, 28, -0.1, 14),
  createIntersection('int-karol', 'Karol Bagh', 28.6512, 77.191, 88, 0.5, 16),
  createIntersection('int-paharganj', 'Paharganj', 28.642, 77.208, 76, 0.35, 18),
  createIntersection('int-lodhi', 'Lodhi Road', 28.589, 77.227, 55, 0.12, 20),
  createIntersection('int-safdarjung', 'Safdarjung', 28.568, 77.207, 48, 0.05, 22),
]

function road(
  id: string,
  name: string,
  from: string,
  to: string,
  coords: [number, number][],
  density: number,
  risk = 0.05
): RoadSegment {
  const distance = coords.reduce((sum, c, i) => {
    if (i === 0) return 0
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    const dlat = (lat2 - lat1) * 111320
    const dlng = (lng2 - lng1) * 111320 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180))
    return sum + Math.sqrt(dlat * dlat + dlng * dlng)
  }, 0)
  return {
    id,
    name,
    from,
    to,
    distance,
    trafficDensity: Math.max(5, Math.min(100, density + (Math.random() - 0.5) * 6)),
    congestionTrend: Math.random() * 0.4 - 0.15,
    blockageRisk: risk,
    blocked: false,
    coordinates: coords,
  }
}

export const INITIAL_ROADS: RoadSegment[] = [
  road('rd-cp-rajiv', 'Connaught Place to Rajiv Chowk', 'int-cp', 'int-rajiv', [[77.2167, 28.6315], [77.2195, 28.6328]], 55),
  road('rd-rajiv-barak', 'Rajiv Chowk to Barakhamba', 'int-rajiv', 'int-barakhamba', [[77.2195, 28.6328], [77.222, 28.628]], 62),
  road('rd-barak-ito', 'Barakhamba to ITO', 'int-barakhamba', 'int-ito', [[77.222, 28.628], [77.241, 28.6285]], 78),
  road('rd-cp-janpath', 'Connaught Place to Janpath', 'int-cp', 'int-janpath', [[77.2167, 28.6315], [77.211, 28.6275]], 40),
  road('rd-janpath-rashtrapati', 'Janpath to Rashtrapati Bhavan', 'int-janpath', 'int-rashtrapati', [[77.211, 28.6275], [77.199, 28.6145]], 32),
  road('rd-rashtrapati-india', 'Rashtrapati to India Gate', 'int-rashtrapati', 'int-india-gate', [[77.199, 28.6145], [77.2295, 28.6129]], 35),
  road('rd-india-ito', 'India Gate to ITO', 'int-india-gate', 'int-ito', [[77.2295, 28.6129], [77.241, 28.6285]], 70),
  road('rd-ito-mandi', 'ITO to Mandi House', 'int-ito', 'int-mandi', [[77.241, 28.6285], [77.234, 28.625]], 58),
  road('rd-mandi-barak', 'Mandi House to Barakhamba', 'int-mandi', 'int-barakhamba', [[77.234, 28.625], [77.222, 28.628]], 50),
  road('rd-cp-paharganj', 'Connaught Place to Paharganj', 'int-cp', 'int-paharganj', [[77.2167, 28.6315], [77.208, 28.642]], 74),
  road('rd-paharganj-karol', 'Paharganj to Karol Bagh', 'int-paharganj', 'int-karol', [[77.208, 28.642], [77.191, 28.6512]], 85),
  road('rd-india-lodhi', 'India Gate to Lodhi Road', 'int-india-gate', 'int-lodhi', [[77.2295, 28.6129], [77.227, 28.589]], 48),
  road('rd-lodhi-safdarjung', 'Lodhi Road to Safdarjung', 'int-lodhi', 'int-safdarjung', [[77.227, 28.589], [77.207, 28.568]], 42),
  road('rd-safdarjung-lodhi', 'Safdarjung to Lodhi Road', 'int-safdarjung', 'int-lodhi', [[77.207, 28.568], [77.227, 28.589]], 38),
  road('rd-janpath-cp', 'Janpath to Connaught Place', 'int-janpath', 'int-cp', [[77.211, 28.6275], [77.2167, 28.6315]], 38),
  road('rd-barak-cp', 'Barakhamba to Connaught Place', 'int-barakhamba', 'int-cp', [[77.222, 28.628], [77.2167, 28.6315]], 45),
]

export function buildAdjacency(roads: RoadSegment[]): Map<string, { neighbor: string; roadId: string }[]> {
  const adj = new Map<string, { neighbor: string; roadId: string }[]>()
  for (const r of roads) {
    if (r.blocked) continue
    const add = (a: string, b: string, roadId: string) => {
      const list = adj.get(a) ?? []
      list.push({ neighbor: b, roadId })
      adj.set(a, list)
    }
    add(r.from, r.to, r.id)
    add(r.to, r.from, r.id)
  }
  return adj
}

export function nearestIntersection(lat: number, lng: number, intersections: Intersection[]): string {
  let best = intersections[0].id
  let min = Infinity
  for (const i of intersections) {
    const d = haversineM(lat, lng, i.lat, i.lng)
    if (d < min) {
      min = d
      best = i.id
    }
  }
  return best
}

export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
