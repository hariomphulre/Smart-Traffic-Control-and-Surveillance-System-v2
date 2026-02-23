'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Hospital, TrafficSignal, Hotspot, TrafficState } from '@/lib/api'
import { getTrafficState } from '@/lib/api'

// Fix default marker icons in Next.js
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface AmbulanceMapProps {
  hospitals: Hospital[]
  signals: TrafficSignal[]
  hotspots: Hotspot[]
  route: number[][] | null
  selectedHospital: Hospital | null
  startPos: { lat: number; lng: number }
  loading: boolean
}

function FitBounds({ route, selectedHospital, startPos }: {
  route: number[][] | null
  selectedHospital: Hospital | null
  startPos: { lat: number; lng: number }
}) {
  const map = useMap()
  const fitRef = useRef(false)

  useEffect(() => {
    if (fitRef.current || !route || route.length === 0) return
    const pts = [...route]
    if (selectedHospital) pts.push([selectedHospital.lat, selectedHospital.lng])
    pts.push([startPos.lat, startPos.lng])
    const bounds = L.latLngBounds(pts as [number, number][])
    map.fitBounds(bounds, { padding: [40, 40] })
    fitRef.current = true
  }, [map, route, selectedHospital, startPos])

  return null
}

export default function AmbulanceMap({
  hospitals,
  signals,
  hotspots,
  route,
  selectedHospital,
  startPos,
  loading,
}: AmbulanceMapProps) {
  const center: [number, number] = [28.6139, 77.209]

  const [trafficState, setTrafficState] = useState<TrafficState | null>(null)
  const [trafficError, setTrafficError] = useState<string | null>(null)

  // Poll traffic2.json state (via API) so map signals reflect real R/Y/G per lane
  useEffect(() => {
    let cancelled = false

    const fetchState = async () => {
      try {
        const data = await getTrafficState()
        if (!cancelled) {
          setTrafficState(data)
          setTrafficError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setTrafficError('Signal state unavailable')
        }
      }
    }

    fetchState()
    const id = setInterval(fetchState, 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#f8f9fa] dark:bg-[#202124]">
        <p className="text-[#5f6368] dark:text-[#9aa0a6]">Loading map...</p>
      </div>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {route && route.length > 0 && <FitBounds route={route} selectedHospital={selectedHospital} startPos={startPos} />}

      {/* Start position */}
      <CircleMarker
        center={[startPos.lat, startPos.lng]}
        radius={10}
        pathOptions={{ fillColor: '#1a73e8', color: '#1557b0', weight: 2, fillOpacity: 0.9 }}
      >
        <Tooltip>Start (Your location)</Tooltip>
      </CircleMarker>

      {/* Route - Highlighted with thick line and shadow effect */}
      {route && route.length > 1 && (
        <>
          {/* Shadow/outline layer for better visibility */}
          <Polyline
            positions={route as [number, number][]}
            pathOptions={{
              color: '#1a1a1a',
              weight: 12,
              opacity: 0.3,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          {/* Main route line */}
          <Polyline
            positions={route as [number, number][]}
            pathOptions={{
              color: '#34a853',
              weight: 8,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          {/* Inner highlight for extra visibility */}
          <Polyline
            positions={route as [number, number][]}
            pathOptions={{
              color: '#81c995',
              weight: 4,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </>
      )}

      {/* Hospitals */}
      {hospitals.map((h) => (
        <CircleMarker
          key={h.id}
          center={[h.lat, h.lng]}
          radius={12}
          pathOptions={{
            fillColor: '#d93025',
            color: '#b71c1c',
            weight: 2,
            fillOpacity: 0.9,
          }}
        >
          <Popup>
            <strong>{h.name}</strong>
            <br />
            {h.address}
          </Popup>
          <Tooltip>{h.name}</Tooltip>
        </CircleMarker>
      ))}

      {/* Traffic signals along route */}
      {signals.map((s) => {
        const lane = s.lane
        const redOn = trafficState ? Boolean(trafficState[`R${lane}`]) : false
        const yellowOn = trafficState ? Boolean(trafficState[`Y${lane}`]) : false
        const greenOn = trafficState ? Boolean(trafficState[`G${lane}`]) : false

        let color = '#fbbc04'
        if (greenOn) color = '#34a853'
        else if (redOn) color = '#ea4335'
        else if (yellowOn) color = '#fbbc04'

        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={9}
            pathOptions={{
              fillColor: color,
              color,
              weight: 3,
              fillOpacity: 0.95,
            }}
          >
            <Popup>
              <strong>{s.name}</strong>
              <br />
              Signal (Lane {s.lane})<br />
              State:{' '}
              {greenOn ? 'Green' : redOn ? 'Red' : yellowOn ? 'Yellow' : 'Unknown'}
              {trafficError && (
                <>
                  <br />
                  <span className="text-xs text-red-500">{trafficError}</span>
                </>
              )}
            </Popup>
            <Tooltip>{s.name}</Tooltip>
          </CircleMarker>
        )
      })}

      {/* Traffic hotspots (congestion zones) */}
      {hotspots.map((h, i) => (
        <CircleMarker
          key={i}
          center={[h.lat, h.lng]}
          radius={Math.min(8 + h.violations / 2, 20)}
          pathOptions={{
            fillColor: h.severity === 'high' ? '#ea4335' : h.severity === 'medium' ? '#fbbc04' : '#34a853',
            fillOpacity: 0.4,
            color: 'transparent',
          }}
        >
          <Tooltip>
            {h.name} — {h.violations} violations
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
