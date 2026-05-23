'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Polyline,
  Circle,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useSimulationStore } from '@/store/simulationStore'
import { trafficLineColor, THEME } from '@/utils/mapColors'
import { pointToLeaflet, toLeaflet } from '@/map/leafletCoords'
import {
  ambulanceIcon,
  fireBrigadeIcon,
  hospitalIcon,
  fireStationIcon,
  signalIcon,
  dominantSignal,
} from '@/map/icons'
import MapMapControls from '@/components/emergency/MapMapControls'
import {
  IntersectionPopup,
  PoiPopup,
  VehiclePopup,
} from '@/components/emergency/MapPopupCard'
import type { Intersection, RoadSegment } from '@/types/emergency'

/** Google Maps–style dark basemap (free OSM-derived tiles) */
const GOOGLE_DARK_TILES =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

interface LeafletEmergencyMapProps {
  onIntersectionClick?: (id: string) => void
}

export default function LeafletEmergencyMap({
  onIntersectionClick,
}: LeafletEmergencyMapProps) {
  const city = useSimulationStore((s) => s.city)
  const state = useSimulationStore((s) => s.state)
  const vehicleType = useSimulationStore((s) => s.vehicleType)
  const poiType = vehicleType === 'ambulance' ? 'hospital' : 'fire-station'

  const center = useMemo((): [number, number] => {
    if (!city) return [28.6139, 77.209]
    const [lng, lat] = city.center
    return [lat, lng]
  }, [city])

  const visiblePois = useMemo(
    () => (city ? city.pois.filter((p) => p.type === poiType) : []),
    [city, poiType]
  )

  if (!city) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#8ab4f8] border-t-transparent" />
          <p className="text-sm text-[#9aa0a6]">Connecting to traffic network…</p>
        </div>
      </div>
    )
  }

  const roads = state?.roads ?? city.roads
  const intersections = state?.intersections ?? city.intersections
  const vehicles = state?.vehicles ?? []
  const greenCorridorIds = state?.greenCorridorIds ?? []
  const routeCoords = vehicles[0]?.routeCoordinates ?? []
  const running = state?.running ?? false

  return (
    <MapContainer
      center={center}
      zoom={14}
      minZoom={11}
      maxZoom={18}
      scrollWheelZoom
      dragging
      touchZoom
      doubleClickZoom
      boxZoom
      keyboard
      className="emergency-leaflet-map h-full w-full"
      style={{ background: '#0d1117' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url={GOOGLE_DARK_TILES}
        subdomains="abcd"
        maxZoom={20}
      />

      <MapInteractionHandler />
      <OptionalVehicleFollow vehicle={vehicles[0]} running={running} />
      <MapMapControls />

      {roads.map((road) => (
        <RoadLayer key={road.id} road={road} />
      ))}

      <RouteLayer coords={routeCoords} animate={running} />

      {intersections
        .filter((i) => greenCorridorIds.includes(i.id))
        .map((i) => (
          <Circle
            key={`corridor-${i.id}`}
            center={pointToLeaflet(i.lng, i.lat)}
            radius={800}
            pathOptions={{
              color: '#8ab4f8',
              fillColor: 'rgba(138, 180, 248, 0.12)',
              fillOpacity: 1,
              weight: 1,
              dashArray: '6 4',
            }}
          />
        ))}

      {visiblePois.map((p) => (
        <Marker
          key={p.id}
          position={pointToLeaflet(p.lng, p.lat)}
          icon={p.type === 'hospital' ? hospitalIcon : fireStationIcon}
          zIndexOffset={400}
        >
          <Popup className="emergency-popup" closeButton minWidth={280} maxWidth={320}>
            <PoiPopup poi={p} />
          </Popup>
        </Marker>
      ))}

      {intersections.map((int) => (
        <IntersectionMarker
          key={int.id}
          intersection={int}
          onSelect={onIntersectionClick}
        />
      ))}

      {vehicles.map((v) => (
        <VehicleMarker key={v.id} vehicle={v} />
      ))}
    </MapContainer>
  )
}

function MapInteractionHandler() {
  const setMapUserPanned = useSimulationStore((s) => s.setMapUserPanned)

  useMapEvents({
    dragstart: () => setMapUserPanned(true),
    zoomstart: () => setMapUserPanned(true),
  })

  return null
}

function OptionalVehicleFollow({
  vehicle,
  running,
}: {
  vehicle?: {
    lat: number
    lng: number
    active: boolean
    heading: number
  }
  running: boolean
}) {
  const map = useMap()
  const follow = useSimulationStore((s) => s.followVehicle)
  const userPanned = useSimulationStore((s) => s.mapUserPanned)
  const lastPan = useRef(0)

  useEffect(() => {
    if (!vehicle?.active || !running || !follow || userPanned) return
    const now = Date.now()
    if (now - lastPan.current < 1200) return
    lastPan.current = now
    map.panTo(pointToLeaflet(vehicle.lng, vehicle.lat), {
      animate: true,
      duration: 0.6,
      easeLinearity: 0.25,
    })
  }, [vehicle?.lat, vehicle?.lng, vehicle?.active, running, follow, userPanned, map])

  return null
}

function RoadLayer({ road }: { road: RoadSegment }) {
  const positions = toLeaflet(road.coordinates)
  if (positions.length < 2) return null
  const color = road.blocked ? '#5f6368' : trafficLineColor(road.trafficDensity)
  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight: road.blocked ? 4 : 6 + road.trafficDensity / 30,
        opacity: road.blocked ? 0.35 : 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: road.blocked ? '10 8' : undefined,
      }}
    />
  )
}

function RouteLayer({
  coords,
  animate,
}: {
  coords: [number, number][]
  animate: boolean
}) {
  const [opacity, setOpacity] = useState(0.85)
  const positions = toLeaflet(coords)

  useEffect(() => {
    if (!animate || positions.length < 2) return
    let phase = 0
    let frame = 0
    const tick = () => {
      phase += 0.035
      setOpacity(0.65 + Math.sin(phase) * 0.3)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animate, positions.length])

  if (positions.length < 2) return null

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#8ab4f8',
          weight: 16,
          opacity: opacity * 0.22,
          lineCap: 'round',
        }}
      />
      <Polyline
        positions={positions}
        pathOptions={{
          color: THEME.route,
          weight: 5,
          opacity,
          lineCap: 'round',
        }}
      />
    </>
  )
}

function IntersectionMarker({
  intersection: int,
  onSelect,
}: {
  intersection: Intersection
  onSelect?: (id: string) => void
}) {
  return (
    <Marker
      key={`${int.id}-${int.north.state}-${int.north.countdown}-${int.greenCorridorActive}`}
      position={pointToLeaflet(int.lng, int.lat)}
      icon={signalIcon(
        int.greenCorridorActive,
        int.overrideActive,
        dominantSignal(int)
      )}
      zIndexOffset={int.greenCorridorActive ? 500 : 200}
      eventHandlers={{ click: () => onSelect?.(int.id) }}
    >
      <Popup className="emergency-popup" closeButton minWidth={300} maxWidth={340}>
        <IntersectionPopup int={int} />
      </Popup>
    </Marker>
  )
}

function VehicleMarker({
  vehicle: v,
}: {
  vehicle: {
    id: string
    type: string
    lat: number
    lng: number
    speed: number
    active: boolean
    heading: number
    etaSeconds: number
    targetPoiName?: string
  }
}) {
  const icon = v.type === 'ambulance' ? ambulanceIcon : fireBrigadeIcon

  return (
    <Marker
      position={pointToLeaflet(v.lng, v.lat)}
      icon={icon}
      zIndexOffset={1000}
    >
      {v.active && (
        <Popup className="emergency-popup" closeButton minWidth={260}>
          <VehiclePopup
            type={v.type}
            speed={v.speed}
            etaSeconds={v.etaSeconds}
            target={v.targetPoiName ?? 'Destination'}
          />
        </Popup>
      )}
    </Marker>
  )
}
