'use client'

import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const trafficHotspots = [
  { name: 'MG Road Junction', violations: 156, lat: 28.6139, lng: 77.2090, severity: 'high' },
  { name: 'City Center', violations: 143, lat: 28.6280, lng: 77.2200, severity: 'high' },
  { name: 'Station Square', violations: 98, lat: 28.6400, lng: 77.2300, severity: 'medium' },
]

export default function LeafletMap() {
  const getMarkerColor = (severity: string) => {
    if (severity === 'high') return '#dc2626'
    if (severity === 'medium') return '#ea580c'
    return '#ca8a04'
  }

  return (
    <MapContainer
      center={[28.6139, 77.2090]}
      zoom={12}
      scrollWheelZoom
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {trafficHotspots.map((hotspot, index) => (
        <CircleMarker
          key={index}
          center={[hotspot.lat, hotspot.lng]}
          radius={20}
          pathOptions={{
            fillColor: getMarkerColor(hotspot.severity),
            fillOpacity: 0.6,
            color: getMarkerColor(hotspot.severity),
            weight: 2,
          }}
        >
          <Popup>
            <strong>{hotspot.name}</strong>
            <br />
            {hotspot.violations} violations
          </Popup>

          <Tooltip direction="top">
            {hotspot.name}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
