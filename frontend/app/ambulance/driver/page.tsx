'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { FiLogOut, FiNavigation, FiMapPin, FiZap, FiClock, FiTarget } from 'react-icons/fi'
import {
  getHospitals,
  getSignals,
  getHotspots,
  triggerSignal,
  type Hospital,
  type TrafficSignal,
  type Hotspot,
} from '@/lib/api'

const DRIVER_STORAGE_KEY = 'ambulance_driver'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'

const DEFAULT_START = { lat: 28.6139, lng: 77.2090 } // MG Road

const AmbulanceMap = dynamic(() => import('@/components/AmbulanceMap'), { ssr: false })

function distanceToSegment(
  point: { lat: number; lng: number },
  segment: [[number, number], [number, number]]
): number {
  const [a, b] = segment
  const px = point.lng
  const py = point.lat
  const ax = a[0]
  const ay = a[1]
  const bx = b[0]
  const by = b[1]
  const abx = bx - ax
  const aby = by - ay
  const apx = px - ax
  const apy = py - ay
  const ab2 = abx * abx + aby * aby
  let t = ab2 === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2))
  const nearestLng = ax + t * abx
  const nearestLat = ay + t * aby
  const R = 6371e3
  const dLat = ((nearestLat - py) * Math.PI) / 180
  const dLon = ((nearestLng - px) * Math.PI) / 180
  const y =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((py * Math.PI) / 180) *
      Math.cos((nearestLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(y), Math.sqrt(1 - y))
  return R * c
}

export default function AmbulanceDriverPage() {
  const router = useRouter()
  const [driver, setDriver] = useState<{ id: string; name: string } | null>(null)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [signals, setSignals] = useState<TrafficSignal[]>([])
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [route, setRoute] = useState<number[][] | null>(null)
  const [routeDistance, setRouteDistance] = useState<number | null>(null) // in meters
  const [routeDuration, setRouteDuration] = useState<number | null>(null) // in seconds
  const [routeSignals, setRouteSignals] = useState<TrafficSignal[]>([])
  const [triggering, setTriggering] = useState<string | null>(null)
  const [startPos, setStartPos] = useState(DEFAULT_START)
  const [loading, setLoading] = useState(true)
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(DRIVER_STORAGE_KEY)
    if (!stored) {
      router.push('/ambulance/sign-in')
      return
    }
    try {
      const d = JSON.parse(stored)
      setDriver(d)
    } catch {
      router.push('/ambulance/sign-in')
    }
  }, [router])

  useEffect(() => {
    const fetch = async () => {
      try {
        const [h, s, hot] = await Promise.all([
          getHospitals(),
          getSignals(),
          getHotspots(),
        ])
        setHospitals(h)
        setSignals(s)
        setHotspots(hot)
      } catch (err) {
        console.error('Failed to fetch ambulance data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const fetchRoute = useCallback(async () => {
    if (!selectedHospital) return
    setRouteLoading(true)
    setRoute(null)
    setRouteDistance(null)
    setRouteDuration(null)
    setRouteSignals([])
    try {
      const url = `${OSRM_BASE}/${startPos.lng},${startPos.lat};${selectedHospital.lng},${selectedHospital.lat}?overview=full&geometries=geojson`
      const res = await fetch(url)
      const data = await res.json()
      if (data.code !== 'Ok' || !data.routes?.[0]) {
        throw new Error('Route not found')
      }
      const routeData = data.routes[0]
      const coords = routeData.geometry.coordinates as number[][]
      setRoute(coords.map((c) => [c[1], c[0]]))
      setRouteDistance(routeData.distance) // meters
      setRouteDuration(routeData.duration) // seconds

      const segments: [[number, number], [number, number]][] = []
      for (let i = 0; i < coords.length - 1; i++) {
        segments.push([
          [coords[i][0], coords[i][1]],
          [coords[i + 1][0], coords[i + 1][1]],
        ])
      }

      const nearSignals: { signal: TrafficSignal; minDist: number }[] = []
      for (const signal of signals) {
        let minDist = Infinity
        for (const seg of segments) {
          const d = distanceToSegment(
            { lat: signal.lat, lng: signal.lng },
            seg
          )
          if (d < minDist) minDist = d
        }
        if (minDist < 400) {
          nearSignals.push({ signal, minDist })
        }
      }
      nearSignals.sort((a, b) => a.minDist - b.minDist)
      setRouteSignals(nearSignals.map((s) => s.signal))
    } catch (err) {
      console.error('Failed to fetch route:', err)
    } finally {
      setRouteLoading(false)
    }
  }, [selectedHospital, startPos, signals])

  useEffect(() => {
    if (selectedHospital && signals.length > 0) {
      fetchRoute()
    }
  }, [selectedHospital?.id, signals.length, fetchRoute])

  const handleTriggerSignal = async (signalId: string) => {
    setTriggering(signalId)
    try {
      await triggerSignal(signalId)
    } catch (err) {
      console.error('Failed to trigger signal:', err)
    } finally {
      setTriggering(null)
    }
  }

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DRIVER_STORAGE_KEY)
    }
    router.push('/ambulance/sign-in')
  }

  if (!driver) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[#5f6368] dark:text-[#9aa0a6]">Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#dadce0] dark:border-[#3c4043]">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-[#202124] dark:text-[#e8eaed]">
            Ambulance Driver
          </h1>
          <span className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
            {driver.name}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f8f9fa] dark:hover:bg-[#35363a] rounded-lg transition-colors"
        >
          <FiLogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-80 border-r border-[#dadce0] dark:border-[#3c4043] flex flex-col overflow-hidden">
          <div className="p-4 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-[#202124] dark:text-[#e8eaed] mb-2">
                Select Hospital
              </label>
              <select
                value={selectedHospital?.id ?? ''}
                onChange={(e) => {
                  const h = hospitals.find((x) => x.id === e.target.value)
                  setSelectedHospital(h ?? null)
                }}
                className="w-full px-4 py-2 rounded-lg border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              >
                <option value="">Choose destination...</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchRoute}
              disabled={!selectedHospital || routeLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              <FiNavigation className="w-4 h-4" />
              {routeLoading ? 'Getting route...' : 'Get traffic-aware route'}
            </button>

            {route && selectedHospital && (
              <div className="gcloud-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[#202124] dark:text-[#e8eaed]">
                  <FiTarget className="w-4 h-4 text-[#1a73e8]" />
                  <span>Destination: {selectedHospital.name}</span>
                </div>
                {routeDistance !== null && routeDuration !== null && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-[#fbbc04]" />
                      <div>
                        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Estimated Time</p>
                        <p className="text-sm font-medium text-[#202124] dark:text-[#e8eaed]">
                          {routeDuration < 60
                            ? `${Math.round(routeDuration)} sec`
                            : routeDuration < 3600
                            ? `${Math.round(routeDuration / 60)} min`
                            : `${Math.round(routeDuration / 3600)}h ${Math.round((routeDuration % 3600) / 60)}m`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiNavigation className="w-4 h-4 text-[#34a853]" />
                      <div>
                        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Distance</p>
                        <p className="text-sm font-medium text-[#202124] dark:text-[#e8eaed]">
                          {routeDistance < 1000
                            ? `${Math.round(routeDistance)} m`
                            : `${(routeDistance / 1000).toFixed(1)} km`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] pt-2 border-t border-[#dadce0] dark:border-[#3c4043]">
                  Route plotted. Traffic hotspots shown on map.
                </p>
              </div>
            )}

            {routeSignals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2">
                  <FiZap className="w-4 h-4 text-[#fbbc04]" />
                  Signals on your path
                </h3>
                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-2">
                  Tap &quot;Trigger&quot; when you approach each signal
                </p>
                <div className="space-y-2">
                  {routeSignals.map((sig) => (
                    <div
                      key={sig.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#35363a]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FiMapPin className="w-4 h-4 text-[#1a73e8] shrink-0" />
                        <span className="text-sm text-[#202124] dark:text-[#e8eaed] truncate">
                          {sig.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleTriggerSignal(sig.id)}
                        disabled={triggering === sig.id}
                        className="shrink-0 px-3 py-1.5 text-xs font-medium rounded bg-[#34a853] hover:bg-[#2d8e47] disabled:opacity-50 text-white transition-colors"
                      >
                        {triggering === sig.id ? 'Triggering...' : 'Trigger'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <AmbulanceMap
            hospitals={hospitals}
            signals={signals}
            hotspots={hotspots}
            route={route}
            selectedHospital={selectedHospital}
            startPos={startPos}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
