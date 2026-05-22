import type { EmergencyVehicle, Intersection } from '../types.js'
import { haversineM } from '../data/city.js'
import { setAllDirections, restoreIntersection } from '../signals/controller.js'

const GREEN_CORRIDOR_RADIUS_M = 1000

export function applyGreenCorridor(
  vehicles: EmergencyVehicle[],
  intersections: Intersection[]
): { intersections: Intersection[]; activeIds: string[] } {
  const activeIds = new Set<string>()
  let result = [...intersections]

  for (const vehicle of vehicles) {
    if (!vehicle.active) continue
    for (const int of result) {
      const dist = haversineM(vehicle.lat, vehicle.lng, int.lat, int.lng)
      const onRoute = vehicle.routeNodeIds.includes(int.id)
      if (dist <= GREEN_CORRIDOR_RADIUS_M && onRoute) {
        activeIds.add(int.id)
        const idx = result.findIndex((i) => i.id === int.id)
        if (idx >= 0 && !result[idx].greenCorridorActive) {
          result[idx] = {
            ...setAllDirections(result[idx], 'green', 50),
            greenCorridorActive: true,
            savedStates: result[idx].savedStates ?? {
              north: { ...result[idx].north },
              south: { ...result[idx].south },
              east: { ...result[idx].east },
              west: { ...result[idx].west },
            },
          }
        }
      }
    }
  }

  // Restore intersections no longer in corridor
  result = result.map((int) => {
    if (int.greenCorridorActive && !activeIds.has(int.id)) {
      return restoreIntersection(int)
    }
    return int
  })

  return { intersections: result, activeIds: [...activeIds] }
}

export function getNearbyIntersections(
  lat: number,
  lng: number,
  intersections: Intersection[],
  radiusM = 1500
): Intersection[] {
  return intersections
    .map((int) => ({ int, dist: haversineM(lat, lng, int.lat, int.lng) }))
    .filter(({ dist }) => dist <= radiusM)
    .sort((a, b) => a.dist - b.dist)
    .map(({ int }) => int)
}
