import { io, Socket } from 'socket.io-client'
import type { CityInit, Intersection, RoadSegment, SimulationState, VehicleType, EmergencyVehicle } from '@/types/emergency'

const SOCKET_URL =
  process.env.NEXT_PUBLIC_EMERGENCY_SOCKET_URL || 'http://localhost:4000'

let socket: Socket | null = null

export type SocketHandlers = {
  onConnect?: () => void
  onDisconnect?: () => void
  onInit?: (city: CityInit) => void
  onState?: (state: SimulationState) => void
  onSignals?: (intersections: Intersection[]) => void
  onTraffic?: (roads: RoadSegment[]) => void
  onVehicles?: (vehicles: EmergencyVehicle[]) => void
}

export function getEmergencySocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
  }
  return socket
}

export function bindSocketHandlers(handlers: SocketHandlers): () => void {
  const s = getEmergencySocket()

  const onConnect = () => handlers.onConnect?.()
  const onDisconnect = () => handlers.onDisconnect?.()
  const onInit = (data: CityInit) => handlers.onInit?.(data)
  const onState = (data: SimulationState) => handlers.onState?.(data)
  const onSignals = (data: Intersection[]) => handlers.onSignals?.(data)
  const onTraffic = (data: RoadSegment[]) => handlers.onTraffic?.(data)
  const onVehicles = (data: EmergencyVehicle[]) => handlers.onVehicles?.(data)

  s.on('connect', onConnect)
  s.on('disconnect', onDisconnect)
  s.on('simulation:init', onInit)
  s.on('simulation:state', onState)
  s.on('signal:update', onSignals)
  s.on('traffic:update', onTraffic)
  s.on('emergency:move', onVehicles)
  s.on('route:update', onVehicles)

  return () => {
    s.off('connect', onConnect)
    s.off('disconnect', onDisconnect)
    s.off('simulation:init', onInit)
    s.off('simulation:state', onState)
    s.off('signal:update', onSignals)
    s.off('traffic:update', onTraffic)
    s.off('emergency:move', onVehicles)
    s.off('route:update', onVehicles)
  }
}

export function emitStart(vehicleType: VehicleType) {
  getEmergencySocket().emit('simulation:start', { vehicleType })
}

export function emitStop() {
  getEmergencySocket().emit('simulation:stop')
}

export function emitReset() {
  getEmergencySocket().emit('simulation:reset')
}

export function emitResume() {
  getEmergencySocket().emit('simulation:resume')
}

export function emitSignalConfigure(payload: {
  intersectionId: string
  direction: 'north' | 'south' | 'east' | 'west'
  state?: 'red' | 'yellow' | 'green'
  countdown?: number
}) {
  getEmergencySocket().emit('signal:configure', payload)
}

export function emitOverride(intersectionId: string, action: 'green' | 'red' | 'extend-green' | 'emergency') {
  getEmergencySocket().emit('emergency:override', { intersectionId, action })
}

export function emitTrafficUpdate(payload: {
  roadId?: string
  intersectionId?: string
  density: number
}) {
  getEmergencySocket().emit('traffic:update', payload)
}

export function emitRoadBlock(roadId: string, blocked: boolean) {
  getEmergencySocket().emit('road:block', { roadId, blocked })
}
