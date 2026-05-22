import { uuidv4 } from '../utils/id.js'
import {
  INITIAL_INTERSECTIONS,
  INITIAL_ROADS,
  nearestIntersection,
  getMissionSetup,
  haversineM,
} from '../data/city.js'
import { findOptimalPath } from '../algorithms/astar.js'
import { tickSignals, manualOverride } from '../signals/controller.js'
import { applyGreenCorridor } from '../services/greenCorridor.js'
import type { EmergencyVehicle, EventLog, SimulationState, VehicleType, SignalColor } from '../types.js'
import { SIGNAL_CYCLE } from '../traffic/signalCycles.js'
import { DEFAULT_WEIGHTS as WEIGHTS } from '../types.js'

const TICK_MS = 50
const SIGNAL_TICK_EVERY = 20 // 1 real second per countdown step
const TRAFFIC_TICK_EVERY = 40
const REROUTE_CHECK_EVERY = 30 // ~1.5s — keeps finding best path while running
/** Map movement faster without changing displayed speed (km/h) */
const MOVEMENT_TIME_SCALE = 3.5

const SPEED_LIMITS = {
  ambulance: { max: 30, min: 12, emergencyBoost: 1.15 },
  'fire-brigade': { max: 26, min: 10, emergencyBoost: 1.1 },
} as const

export class SimulationEngine {
  state: SimulationState
  private interval: ReturnType<typeof setInterval> | null = null
  private onBroadcast: (state: SimulationState) => void
  vehicleType: VehicleType = 'ambulance'

  constructor(onBroadcast: (state: SimulationState) => void) {
    this.onBroadcast = onBroadcast
    this.state = this.createInitialState()
  }

  private createInitialState(): SimulationState {
    return {
      running: false,
      tick: 0,
      vehicles: [],
      intersections: structuredClone(INITIAL_INTERSECTIONS),
      roads: structuredClone(INITIAL_ROADS).map((r) => ({
        ...r,
        trafficDensity: Math.max(0, Math.min(100, r.trafficDensity)),
      })),
      eventLogs: [],
      activeOverrides: [],
      greenCorridorIds: [],
    }
  }

  private log(level: EventLog['level'], message: string) {
    const entry: EventLog = {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      message,
    }
    this.state.eventLogs = [entry, ...this.state.eventLogs].slice(0, 80)
  }

  start(vehicleType: VehicleType) {
    if (this.state.running) return
    this.vehicleType = vehicleType
    if (this.state.vehicles.length === 0) {
      this.spawnVehicle(vehicleType)
    }
    this.state.running = true
    this.startLoop()
    this.log('success', 'Started — heading to destination')
    this.broadcast()
  }

  resume() {
    if (this.state.running) return
    const vehicle = this.state.vehicles[0]
    if (!vehicle) {
      this.start(this.vehicleType)
      return
    }
    this.optimizeRoute(vehicle, true)
    this.state.running = true
    this.startLoop()
    this.log('success', 'Resumed — route updated for current traffic')
    this.broadcast()
  }

  stop() {
    this.state.running = false
    if (this.interval) clearInterval(this.interval)
    this.interval = null
    this.log('warn', 'Paused — you can change lights then Resume')
    this.broadcast()
  }

  reset() {
    this.stop()
    this.state = this.createInitialState()
    this.log('info', 'Map reset')
    this.broadcast()
  }

  private spawnVehicle(type: VehicleType) {
    const { targetPoi, startNodeId } = getMissionSetup(type)
    const startInt = this.state.intersections.find((i) => i.id === startNodeId)!
    const goalNode = nearestIntersection(targetPoi.lat, targetPoi.lng, this.state.intersections)

    const path = findOptimalPath(
      startNodeId,
      goalNode,
      this.state.intersections,
      this.state.roads,
      WEIGHTS,
      true
    )

    if (!path) {
      this.log('warn', 'No route found')
      return
    }

    const vehicle: EmergencyVehicle = {
      id: uuidv4(),
      type,
      lat: startInt.lat,
      lng: startInt.lng,
      heading: 0,
      speed: 0,
      targetPoiId: targetPoi.id,
      targetPoiName: targetPoi.name,
      routeNodeIds: path.nodeIds,
      routeCoordinates: path.coordinates,
      progress: 0,
      priority: 'high',
      active: true,
      etaSeconds: path.estimatedTimeSeconds,
      distanceRemaining: path.totalDistance,
    }
    this.state.vehicles = [vehicle]
    this.log(
      'info',
      `Route ready — ${(path.totalDistance / 1000).toFixed(1)} km, about ${formatDuration(path.estimatedTimeSeconds)}`
    )
  }

  /** Recalculate best path from the vehicle's current position */
  private optimizeRoute(vehicle: EmergencyVehicle, silent = false): boolean {
    if (!vehicle.active) return false

    const poi = getMissionSetup(vehicle.type).targetPoi
    const currentNode = nearestIntersection(vehicle.lat, vehicle.lng, this.state.intersections)
    const goalNode = nearestIntersection(poi.lat, poi.lng, this.state.intersections)
    const prevNodes = vehicle.routeNodeIds.join(',')

    const path = findOptimalPath(
      currentNode,
      goalNode,
      this.state.intersections,
      this.state.roads,
      WEIGHTS,
      true
    )
    if (!path) return false

    const newKey = path.nodeIds.join(',')
    const pathChanged = prevNodes !== newKey
    if (!pathChanged && silent) return false

    const routeLength = pathLengthM(path.coordinates)

    vehicle.routeNodeIds = path.nodeIds
    vehicle.routeCoordinates = path.coordinates
    vehicle.progress = progressAtNearestOnPath(
      path.coordinates,
      vehicle.lat,
      vehicle.lng
    )
    vehicle.distanceRemaining = routeLength * (1 - vehicle.progress)
    vehicle.etaSeconds = Math.max(3, vehicle.distanceRemaining / 12)

    const pos = interpolateAlongPath(path.coordinates, vehicle.progress)
    vehicle.lat = pos.lat
    vehicle.lng = pos.lng
    vehicle.heading = pos.heading

    if (!silent && pathChanged) {
      this.log('info', `Route updated — about ${formatDuration(vehicle.etaSeconds)} left`)
    }
    return true
  }

  configureSignal(
    intersectionId: string,
    direction: 'north' | 'south' | 'east' | 'west',
    updates: { state?: SignalColor; countdown?: number }
  ) {
    this.state.intersections = this.state.intersections.map((int) => {
      if (int.id !== intersectionId) return int
      const cur = int[direction]
      const next: typeof cur = {
        ...cur,
        ...(updates.state !== undefined
          ? {
              state: updates.state,
              defaultCycle: SIGNAL_CYCLE[updates.state],
            }
          : {}),
        ...(updates.countdown !== undefined ? { countdown: updates.countdown } : {}),
      }
      return { ...int, [direction]: next }
    })
    this.broadcast()
  }

  setRoadDensity(roadId: string, density: number) {
    this.state.roads = this.state.roads.map((r) =>
      r.id === roadId ? { ...r, trafficDensity: Math.max(0, Math.min(100, density)) } : r
    )
    this.syncIntersectionDensity()
    this.broadcast()
  }

  setIntersectionDensity(intersectionId: string, density: number) {
    this.state.intersections = this.state.intersections.map((i) =>
      i.id === intersectionId
        ? {
            ...i,
            trafficDensity: Math.max(0, Math.min(100, density)),
            congestionScore: Math.min(100, density * 0.95),
          }
        : i
    )
    this.broadcast()
  }

  signalOverride(intersectionId: string, action: 'green' | 'red' | 'extend-green' | 'emergency') {
    this.state.intersections = manualOverride(this.state.intersections, intersectionId, action)
    if (!this.state.activeOverrides.includes(intersectionId)) {
      this.state.activeOverrides = [...this.state.activeOverrides, intersectionId]
    }
    const name = this.state.intersections.find((i) => i.id === intersectionId)?.name ?? intersectionId
    this.log('warn', `Signal updated at ${name}`)
    this.broadcast()
  }

  blockRoad(roadId: string, blocked: boolean) {
    const road = this.state.roads.find((r) => r.id === roadId)
    this.state.roads = this.state.roads.map((r) =>
      r.id === roadId ? { ...r, blocked, blockageRisk: blocked ? 1 : 0.05 } : r
    )
    this.log('warn', `${road?.name ?? roadId} ${blocked ? 'BLOCKED' : 'reopened'}`)
    const v = this.state.vehicles[0]
    if (blocked && v?.active) this.optimizeRoute(v, true)
    else this.broadcast()
  }

  private syncIntersectionDensity() {
    this.state.intersections = this.state.intersections.map((int) => {
      const connected = this.state.roads.filter(
        (r) => (r.from === int.id || r.to === int.id) && !r.blocked
      )
      if (!connected.length) return int
      const avg = connected.reduce((s, r) => s + r.trafficDensity, 0) / connected.length
      return {
        ...int,
        trafficDensity: avg,
        congestionScore: Math.min(100, avg * 0.92 + int.congestionTrend * 5),
      }
    })
  }

  private startLoop() {
    if (this.interval) clearInterval(this.interval)
    this.interval = setInterval(() => this.tick(), TICK_MS)
  }

  private tick() {
    if (!this.state.running) return
    this.state.tick++

    if (this.state.tick % TRAFFIC_TICK_EVERY === 0) {
      this.evolveTraffic()
    }

    if (this.state.tick % SIGNAL_TICK_EVERY === 0) {
      this.state.intersections = tickSignals(this.state.intersections)
    }

    for (const vehicle of this.state.vehicles) {
      if (!vehicle.active || vehicle.routeCoordinates.length < 2) continue
      this.moveVehicle(vehicle)
    }

    const corridor = applyGreenCorridor(this.state.vehicles, this.state.intersections)
    this.state.intersections = corridor.intersections
    this.state.greenCorridorIds = corridor.activeIds

    if (this.state.tick % REROUTE_CHECK_EVERY === 0) {
      this.checkAutoReroute()
    }

    this.broadcast()
  }

  private evolveTraffic() {
    this.state.roads = this.state.roads.map((r) => {
      const trend = r.congestionTrend + (Math.random() - 0.5) * 0.08
      const delta = trend * 3 + (Math.random() - 0.5) * 3
      return {
        ...r,
        trafficDensity: Math.max(5, Math.min(100, r.trafficDensity + delta)),
        congestionTrend: Math.max(-1, Math.min(1, trend)),
      }
    })
    this.syncIntersectionDensity()
  }

  private moveVehicle(vehicle: EmergencyVehicle) {
    const limits = SPEED_LIMITS[vehicle.type]
    const avgDensity = this.getRouteAvgDensity(vehicle)
    const corridorBoost = this.state.greenCorridorIds.some((id) =>
      vehicle.routeNodeIds.includes(id)
    )
      ? limits.emergencyBoost
      : 1

    const densityFactor = 1 - avgDensity / 220
    const speed =
      Math.max(limits.min, limits.max * Math.max(0.45, densityFactor)) * corridorBoost

    const routeLength = pathLengthM(vehicle.routeCoordinates)
    const advance =
      (speed * (TICK_MS / 1000) * MOVEMENT_TIME_SCALE) / Math.max(routeLength, 1)
    vehicle.progress = Math.min(1, vehicle.progress + advance)

    const pos = interpolateAlongPath(vehicle.routeCoordinates, vehicle.progress)
    vehicle.lat = pos.lat
    vehicle.lng = pos.lng
    vehicle.heading = pos.heading
    vehicle.speed = speed * 3.6
    vehicle.distanceRemaining = routeLength * (1 - vehicle.progress)
    vehicle.etaSeconds = Math.max(3, vehicle.distanceRemaining / speed)

    if (vehicle.progress >= 0.999) {
      vehicle.active = false
      vehicle.speed = 0
      vehicle.progress = 1
      vehicle.distanceRemaining = 0
      vehicle.etaSeconds = 0
      this.log('success', `Unit arrived at ${vehicle.targetPoiName}`)
    }
  }

  private checkAutoReroute() {
    const vehicle = this.state.vehicles.find((v) => v.active)
    if (!vehicle) return
    this.optimizeRoute(vehicle, true)
  }

  private getRouteAvgDensity(vehicle: EmergencyVehicle): number {
    const roads = this.state.roads.filter(
      (r) => vehicle.routeNodeIds.includes(r.from) || vehicle.routeNodeIds.includes(r.to)
    )
    if (!roads.length) return 50
    return roads.reduce((s, r) => s + r.trafficDensity, 0) / roads.length
  }

  getSnapshot(): SimulationState {
    return structuredClone(this.state)
  }

  private broadcast() {
    this.onBroadcast(this.getSnapshot())
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function pathLengthM(coords: [number, number][]): number {
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    total += haversineM(lat1, lng1, lat2, lng2)
  }
  return total || 1
}

function interpolateAlongPath(
  coords: [number, number][],
  t: number
): { lat: number; lng: number; heading: number } {
  const total = pathLengthM(coords)
  const target = t * total
  let walked = 0
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    const seg = haversineM(lat1, lng1, lat2, lng2)
    if (walked + seg >= target) {
      const segT = (target - walked) / (seg || 1)
      return {
        lat: lat1 + (lat2 - lat1) * segT,
        lng: lng1 + (lng2 - lng1) * segT,
        heading: (Math.atan2(lng2 - lng1, lat2 - lat1) * 180) / Math.PI,
      }
    }
    walked += seg
  }
  const last = coords[coords.length - 1]
  return { lat: last[1], lng: last[0], heading: 0 }
}

/** Closest progress (0–1) on path to current vehicle position */
function progressAtNearestOnPath(
  coords: [number, number][],
  lat: number,
  lng: number
): number {
  let bestT = 0
  let bestDist = Infinity
  const steps = 80
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const pos = interpolateAlongPath(coords, t)
    const d = haversineM(lat, lng, pos.lat, pos.lng)
    if (d < bestDist) {
      bestDist = d
      bestT = t
    }
  }
  return bestT
}
