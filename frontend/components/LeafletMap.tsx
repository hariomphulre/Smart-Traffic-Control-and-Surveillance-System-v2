'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getHotspots, type Hotspot } from '@/lib/api'

const HOTSPOTS_PER_PAGE = 20

export default function LeafletMap() {
  const [allHotspots, setAllHotspots] = useState<Hotspot[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHotspots = async () => {
      try {
        setLoading(true)
        setError(null)
        const hotspots = await getHotspots()
        setAllHotspots(hotspots)
        setPage(1)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch hotspots')
        console.error('Error fetching hotspots:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHotspots()
  }, [])

  // Paginate hotspots
  const startIdx = (page - 1) * HOTSPOTS_PER_PAGE
  const trafficHotspots = allHotspots.slice(startIdx, startIdx + HOTSPOTS_PER_PAGE)
  const totalPages = Math.ceil(allHotspots.length / HOTSPOTS_PER_PAGE)

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

  if (allHotspots.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[#5f6368] dark:text-[#9aa0a6]">No hotspots available</p>
      </div>
    )
  }

  // Calculate center from current page hotspots
  const centerLat = trafficHotspots.length > 0 
    ? trafficHotspots.reduce((sum, h) => sum + h.lat, 0) / trafficHotspots.length 
    : 28.6139
  const centerLng = trafficHotspots.length > 0 
    ? trafficHotspots.reduce((sum, h) => sum + h.lng, 0) / trafficHotspots.length 
    : 77.2090

  return (
    <div className="w-full h-full relative">
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
            radius={Math.min(hotspot.violations / 5 + 8, 20)}
            pathOptions={{
              fillColor: getMarkerColor(hotspot.severity),
              fillOpacity: 0.6,
              color: getMarkerColor(hotspot.severity),
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{hotspot.name}</p>
                <p>Violations: {hotspot.violations}</p>
                <p className="capitalize">Severity: {hotspot.severity}</p>
              </div>
            </Popup>

            <Tooltip direction="top">
              {hotspot.name} - {hotspot.violations} violations
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Pagination Controls */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow p-3 flex items-center gap-2">
        <button
          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-[#e8f0fe] dark:bg-[#1a73e8]/10 text-[#1a73e8] dark:text-[#8ab4f8] disabled:opacity-50 hover:bg-[#d2e3fc] dark:hover:bg-[#1a73e8]/20 transition-colors text-sm font-medium"
        >
          ← Prev
        </button>
        <span className="px-2 text-sm font-medium text-[#202124] dark:text-[#e8eaed] whitespace-nowrap">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className="px-3 py-1 rounded bg-[#e8f0fe] dark:bg-[#1a73e8]/10 text-[#1a73e8] dark:text-[#8ab4f8] disabled:opacity-50 hover:bg-[#d2e3fc] dark:hover:bg-[#1a73e8]/20 transition-colors text-sm font-medium"
        >
          Next →
        </button>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow p-3 text-sm">
        <p className="text-[#202124] dark:text-[#e8eaed]">
          Showing {startIdx + 1}-{Math.min(startIdx + HOTSPOTS_PER_PAGE, allHotspots.length)} of {allHotspots.length} hotspots
        </p>
      </div>
    </div>
  )
}
