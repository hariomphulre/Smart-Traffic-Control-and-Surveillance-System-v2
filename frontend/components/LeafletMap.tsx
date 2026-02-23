'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getHotspots, type Hotspot } from '@/lib/api'

export default function LeafletMap() {
  const [trafficHotspots, setTrafficHotspots] = useState<Hotspot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHotspots = async () => {
      try {
        setLoading(true)
        setError(null)
        const hotspots = await getHotspots()
        setTrafficHotspots(hotspots)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch hotspots')
        console.error('Error fetching hotspots:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHotspots()
  }, [])

  const getMarkerColor = (severity: string) => {
    if (severity === 'high') return '#dc2626'
    if (severity === 'medium') return '#ea580c'
    return '#ca8a04'
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[#5f6368] dark:text-[#9aa0a6]">Loading map...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[#d93025] dark:text-[#f28b82]">Error: {error}</p>
      </div>
    )
  }

  if (trafficHotspots.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[#5f6368] dark:text-[#9aa0a6]">No hotspots available</p>
      </div>
    )
  }

  // Calculate center from hotspots if available
  const centerLat = trafficHotspots.length > 0 
    ? trafficHotspots.reduce((sum, h) => sum + h.lat, 0) / trafficHotspots.length 
    : 28.6139
  const centerLng = trafficHotspots.length > 0 
    ? trafficHotspots.reduce((sum, h) => sum + h.lng, 0) / trafficHotspots.length 
    : 77.2090

  return (
    <MapContainer
      center={[centerLat, centerLng]}
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
