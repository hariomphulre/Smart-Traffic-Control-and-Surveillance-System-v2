import type { Intersection, RoadSegment, RouteWeights } from '../types.js'
import { DEFAULT_WEIGHTS } from '../types.js'
import { buildAdjacency } from '../data/city.js'

export interface PathResult {
  nodeIds: string[]
  coordinates: [number, number][]
  totalCost: number
  totalDistance: number
  estimatedTimeSeconds: number
}

function signalWaitCost(intersection: Intersection, isEmergency: boolean): number {
  const dirs = [intersection.north, intersection.south, intersection.east, intersection.west]
  const reds = dirs.filter((d) => d.state === 'red')
  if (reds.length === 0) return 0
  const avgCountdown = reds.reduce((s, d) => s + d.countdown, 0) / reds.length
  return isEmergency ? avgCountdown * 0.3 : avgCountdown
}

/**
 * Modified A* with dynamic weighted cost:
 * Cost = Distance + (TrafficDensity * w1) + (SignalWait * w2) + (CongestionTrend * w3) + (BlockageRisk * w4)
 */
export function findOptimalPath(
  startId: string,
  goalId: string,
  intersections: Intersection[],
  roads: RoadSegment[],
  weights: typeof DEFAULT_WEIGHTS,
  isEmergency = true
): PathResult | null {
  const adj = buildAdjacency(roads)
  const intMap = new Map(intersections.map((i) => [i.id, i]))
  const roadMap = new Map(roads.map((r) => [r.id, r]))

  const heuristic = (id: string): number => {
    const a = intMap.get(id)!
    const b = intMap.get(goalId)!
    return haversineKm(a.lat, a.lng, b.lat, b.lng) * 1000
  }

  const open = new Set([startId])
  const cameFrom = new Map<string, { prev: string; roadId: string }>()
  const gScore = new Map<string, number>()
  gScore.set(startId, 0)

  while (open.size > 0) {
    let current = [...open][0]
    let bestF = Infinity
    for (const id of open) {
      const f = (gScore.get(id) ?? Infinity) + heuristic(id)
      if (f < bestF) {
        bestF = f
        current = id
      }
    }

    if (current === goalId) {
      return reconstruct(current, cameFrom, intMap, roadMap)
    }

    open.delete(current)
    const neighbors = adj.get(current) ?? []

    for (const { neighbor, roadId } of neighbors) {
      const road = roadMap.get(roadId)!
      const node = intMap.get(neighbor)!
      const edgeCost = segmentCost(road, node, weights, isEmergency)
      const tentative = (gScore.get(current) ?? Infinity) + edgeCost

      if (tentative < (gScore.get(neighbor) ?? Infinity)) {
        cameFrom.set(neighbor, { prev: current, roadId })
        gScore.set(neighbor, tentative)
        open.add(neighbor)
      }
    }
  }

  return null
}

function segmentCost(
  road: RoadSegment,
  intersection: Intersection,
  w: typeof DEFAULT_WEIGHTS,
  isEmergency: boolean
): number {
  const distance = road.distance
  const traffic = road.trafficDensity * w.w1
  const signalWait = signalWaitCost(intersection, isEmergency) * w.w2
  const trend = Math.max(0, road.congestionTrend * 100) * w.w3
  const blockage = road.blockageRisk * 100 * w.w4 + (road.blocked ? 10000 : 0)
  return distance + traffic + signalWait + trend + blockage
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function reconstruct(
  goalId: string,
  cameFrom: Map<string, { prev: string; roadId: string }>,
  intMap: Map<string, Intersection>,
  roadMap: Map<string, RoadSegment>
): PathResult {
  const nodeIds: string[] = [goalId]
  let cur = goalId
  while (cameFrom.has(cur)) {
    const { prev } = cameFrom.get(cur)!
    nodeIds.unshift(prev)
    cur = prev
  }

  const coordinates: [number, number][] = []
  let totalDistance = 0
  let totalCost = 0

  for (let i = 0; i < nodeIds.length; i++) {
    const node = intMap.get(nodeIds[i])!
    coordinates.push([node.lng, node.lat])
    if (i > 0) {
      const step = cameFrom.get(nodeIds[i])
      if (step) {
        const road = roadMap.get(step.roadId)!
        totalDistance += road.distance
        totalCost += road.distance + road.trafficDensity
      }
    }
  }

  // Interpolate road geometry for smoother paths
  const smoothCoords = smoothPathCoordinates(nodeIds, cameFrom, roadMap, intMap)

  const avgDensity =
    nodeIds.reduce((s, id) => s + (intMap.get(id)?.trafficDensity ?? 50), 0) / nodeIds.length
  const baseSpeed = 13.89 // ~50 km/h emergency
  const speedFactor = 1 + avgDensity / 100
  const estimatedTimeSeconds = totalDistance / (baseSpeed / speedFactor)

  return {
    nodeIds,
    coordinates: smoothCoords.length > 0 ? smoothCoords : coordinates,
    totalCost,
    totalDistance,
    estimatedTimeSeconds: Math.max(30, estimatedTimeSeconds),
  }
}

function smoothPathCoordinates(
  nodeIds: string[],
  cameFrom: Map<string, { prev: string; roadId: string }>,
  roadMap: Map<string, RoadSegment>,
  intMap: Map<string, Intersection>
): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i < nodeIds.length; i++) {
    if (i === 0) {
      const n = intMap.get(nodeIds[i])!
      out.push([n.lng, n.lat])
      continue
    }
    const step = cameFrom.get(nodeIds[i])
    if (!step) continue
    const road = roadMap.get(step.roadId)
    if (road?.coordinates?.length) {
      for (const c of road.coordinates) out.push(c)
    } else {
      const n = intMap.get(nodeIds[i])!
      out.push([n.lng, n.lat])
    }
  }
  return dedupeCoords(out)
}

function dedupeCoords(coords: [number, number][]): [number, number][] {
  const seen = new Set<string>()
  return coords.filter(([lng, lat]) => {
    const k = `${lng.toFixed(5)},${lat.toFixed(5)}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
