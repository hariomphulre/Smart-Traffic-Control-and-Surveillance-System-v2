import type { FeatureCollection, LineString, Point } from 'geojson'
import type { Intersection, RoadSegment, EmergencyVehicle, POI } from '@/types/emergency'
import { trafficLineColor, THEME } from '@/utils/mapColors'

export function roadsToGeoJSON(roads: RoadSegment[]): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: roads.map((r) => ({
      type: 'Feature',
      properties: {
        id: r.id,
        density: r.trafficDensity,
        blocked: r.blocked,
        color: r.blocked ? '#6b7280' : trafficLineColor(r.trafficDensity),
      },
      geometry: {
        type: 'LineString',
        coordinates: r.coordinates,
      },
    })),
  }
}

export function routeToGeoJSON(coords: [number, number][]): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { type: 'emergency-route' },
        geometry: { type: 'LineString', coordinates: coords },
      },
    ],
  }
}

export function intersectionsToGeoJSON(intersections: Intersection[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: intersections.map((i) => ({
      type: 'Feature',
      properties: {
        id: i.id,
        name: i.name,
        density: i.trafficDensity,
        north: i.north.state,
        south: i.south.state,
        east: i.east.state,
        west: i.west.state,
        nCount: i.north.countdown,
        sCount: i.south.countdown,
        eCount: i.east.countdown,
        wCount: i.west.countdown,
        corridor: i.greenCorridorActive,
        override: i.overrideActive,
      },
      geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
    })),
  }
}

export function poisToGeoJSON(pois: POI[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: pois.map((p) => ({
      type: 'Feature',
      properties: { id: p.id, name: p.name, type: p.type },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  }
}

export function vehiclesToGeoJSON(vehicles: EmergencyVehicle[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: vehicles.map((v) => ({
      type: 'Feature',
      properties: {
        id: v.id,
        type: v.type,
        speed: v.speed,
        active: v.active,
        color: v.type === 'ambulance' ? THEME.ambulance : THEME.fire,
      },
      geometry: { type: 'Point', coordinates: [v.lng, v.lat] },
    })),
  }
}

export function corridorZonesToGeoJSON(
  intersections: Intersection[],
  greenCorridorIds: string[]
): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: intersections
      .filter((i) => greenCorridorIds.includes(i.id))
      .map((i) => ({
        type: 'Feature',
        properties: { id: i.id },
        geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
      })),
  }
}
