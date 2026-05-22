export type SignalColor = 'red' | 'yellow' | 'green'
export type VehicleType = 'ambulance' | 'fire-brigade'
export type UserRole = 'traffic-admin' | 'emergency-ambulance' | 'emergency-fire'
export type EmergencyPriority = 'normal' | 'high' | 'critical'

export interface DirectionSignal {
  state: SignalColor
  countdown: number
  defaultCycle: number
}

export interface Intersection {
  id: string
  name: string
  lat: number
  lng: number
  north: DirectionSignal
  south: DirectionSignal
  east: DirectionSignal
  west: DirectionSignal
  trafficDensity: number
  congestionScore: number
  congestionTrend: number
  overrideActive: boolean
  greenCorridorActive: boolean
}

export interface RoadSegment {
  id: string
  name: string
  from: string
  to: string
  distance: number
  trafficDensity: number
  congestionTrend: number
  blockageRisk: number
  blocked: boolean
  coordinates: [number, number][]
}

export interface POI {
  id: string
  name: string
  type: 'hospital' | 'fire-station'
  lat: number
  lng: number
}

export interface EmergencyVehicle {
  id: string
  type: VehicleType
  lat: number
  lng: number
  heading: number
  speed: number
  targetPoiId: string
  targetPoiName: string
  routeNodeIds: string[]
  routeCoordinates: [number, number][]
  progress: number
  priority: EmergencyPriority
  active: boolean
  etaSeconds: number
  distanceRemaining: number
}

export interface EventLog {
  id: string
  timestamp: number
  level: 'info' | 'warn' | 'success'
  message: string
}

export interface SimulationState {
  running: boolean
  tick: number
  vehicles: EmergencyVehicle[]
  intersections: Intersection[]
  roads: RoadSegment[]
  eventLogs: EventLog[]
  activeOverrides: string[]
  greenCorridorIds: string[]
}

export interface CityInit {
  center: [number, number]
  pois: POI[]
  intersections: Intersection[]
  roads: RoadSegment[]
}
