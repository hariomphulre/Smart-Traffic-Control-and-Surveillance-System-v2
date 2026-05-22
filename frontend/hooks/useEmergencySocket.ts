'use client'

import { useEffect } from 'react'
import { bindSocketHandlers } from '@/services/socket'
import { useSimulationStore } from '@/store/simulationStore'

export function useEmergencySocket() {
  const setConnected = useSimulationStore((s) => s.setConnected)
  const setCity = useSimulationStore((s) => s.setCity)
  const setState = useSimulationStore((s) => s.setState)
  const patchIntersections = useSimulationStore((s) => s.patchIntersections)
  const patchRoads = useSimulationStore((s) => s.patchRoads)
  const patchVehicles = useSimulationStore((s) => s.patchVehicles)

  useEffect(() => {
    const unbind = bindSocketHandlers({
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onInit: (city) => setCity(city),
      onState: (state) => setState(state),
      onSignals: patchIntersections,
      onTraffic: patchRoads,
      onVehicles: patchVehicles,
    })
    return unbind
  }, [setConnected, setCity, setState, patchIntersections, patchRoads, patchVehicles])
}
