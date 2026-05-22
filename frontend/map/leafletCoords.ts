/** GeoJSON / backend uses [lng, lat]; Leaflet uses [lat, lng] */
export function toLeaflet(coords: [number, number][]): [number, number][] {
  return coords.map(([lng, lat]) => [lat, lng])
}

export function pointToLeaflet(lng: number, lat: number): [number, number] {
  return [lat, lng]
}
