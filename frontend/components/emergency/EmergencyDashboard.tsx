'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useEmergencySocket } from '@/hooks/useEmergencySocket'
import { useSimulationStore } from '@/store/simulationStore'
import LeftSidebar from '@/components/emergency/LeftSidebar'
import RightControlPanel from '@/components/emergency/RightControlPanel'
import type { UserRole } from '@/types/emergency'
import '@/app/emergency-route/emergency-map.css'

const LeafletEmergencyMap = dynamic(() => import('@/map/LeafletEmergencyMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#0B1220]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
    </div>
  ),
})

interface EmergencyDashboardProps {
  defaultRole?: UserRole
}

export default function EmergencyDashboard({ defaultRole }: EmergencyDashboardProps) {
  useEmergencySocket()
  const setRole = useSimulationStore((s) => s.setRole)
  const setSelected = useSimulationStore((s) => s.setSelectedIntersection)

  useEffect(() => {
    if (defaultRole) setRole(defaultRole)
  }, [defaultRole, setRole])

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-[#0d1117]">
      <LeftSidebar />
      <main className="relative min-w-0 flex-1">
        <LeafletEmergencyMap onIntersectionClick={setSelected} />
        <div className="map-legend-bar">
          <span className="map-legend-item">
            <span className="map-legend-swatch" style={{ background: '#8ab4f8' }} />
            Your route
          </span>
          <span className="map-legend-item">
            <span className="map-legend-swatch" style={{ background: '#81c995' }} />
            Low density
          </span>
          <span className="map-legend-item">
            <span className="map-legend-swatch" style={{ background: '#fdd663' }} />
            Moderate
          </span>
          <span className="map-legend-item">
            <span className="map-legend-swatch" style={{ background: '#f28b82' }} />
            Heavy
          </span>
        </div>
      </main>
      <RightControlPanel />
    </div>
  )
}
