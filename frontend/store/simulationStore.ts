import { create } from 'zustand'
import type {
  CityInit,
  EmergencyVehicle,
  EventLog,
  Intersection,
  RoadSegment,
  SimulationState,
  UserRole,
  VehicleType,
} from '@/types/emergency'

interface SimulationStore {
  role: UserRole
  vehicleType: VehicleType
  connected: boolean
  city: CityInit | null
  state: SimulationState | null
  selectedIntersectionId: string | null
  followVehicle: boolean
  mapUserPanned: boolean
  setupMode: boolean
  hasStarted: boolean

  setRole: (role: UserRole) => void
  setVehicleType: (type: VehicleType) => void
  setConnected: (v: boolean) => void
  setCity: (city: CityInit) => void
  setState: (state: SimulationState) => void
  setSelectedIntersection: (id: string | null) => void
  setFollowVehicle: (v: boolean) => void
  setMapUserPanned: (v: boolean) => void
  setSetupMode: (setupMode: boolean) => void
  setHasStarted: (hasStarted: boolean) => void
  patchIntersections: (intersections: Intersection[]) => void
  patchRoads: (roads: RoadSegment[]) => void
  patchVehicles: (vehicles: EmergencyVehicle[]) => void
  addLog: (log: EventLog) => void
}

const emptyState = (): SimulationState => ({
  running: false,
  tick: 0,
  vehicles: [],
  intersections: [],
  roads: [],
  eventLogs: [],
  activeOverrides: [],
  greenCorridorIds: [],
})

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  role: 'traffic-admin',
  vehicleType: 'ambulance',
  connected: false,
  city: null,
  state: null,
  selectedIntersectionId: null,
  followVehicle: true,
  mapUserPanned: false,
  setupMode: false,
  hasStarted: false,

  setRole: (role) => {
    const vehicleType: VehicleType =
      role === 'emergency-fire' ? 'fire-brigade' : 'ambulance'
    set({ role, vehicleType })
  },
  setVehicleType: (vehicleType) => set({ vehicleType }),
  setConnected: (connected) => set({ connected }),
  setCity: (city) =>
    set({
      city,
      state: {
        ...emptyState(),
        intersections: city.intersections,
        roads: city.roads,
      },
    }),
  setState: (state) => set({ state }),
  setSelectedIntersection: (selectedIntersectionId) => set({ selectedIntersectionId }),
  setFollowVehicle: (followVehicle) => set({ followVehicle, mapUserPanned: !followVehicle }),
  setMapUserPanned: (mapUserPanned) =>
    set(mapUserPanned ? { mapUserPanned: true, followVehicle: false } : { mapUserPanned: false }),
  setSetupMode: (setupMode) => set({ setupMode }),
  setHasStarted: (hasStarted) => set({ hasStarted }),
  patchIntersections: (intersections) => {
    const s = get().state
    if (!s) return
    set({ state: { ...s, intersections } })
  },
  patchRoads: (roads) => {
    const s = get().state
    if (!s) return
    set({ state: { ...s, roads } })
  },
  patchVehicles: (vehicles) => {
    const s = get().state
    if (!s) return
    set({ state: { ...s, vehicles } })
  },
  addLog: (log) => {
    const s = get().state
    if (!s) return
    set({ state: { ...s, eventLogs: [log, ...s.eventLogs].slice(0, 50) } })
  },
}))

export function densityColor(density: number): string {
  if (density < 35) return '#22c55e'
  if (density < 65) return '#eab308'
  return '#ef4444'
}
