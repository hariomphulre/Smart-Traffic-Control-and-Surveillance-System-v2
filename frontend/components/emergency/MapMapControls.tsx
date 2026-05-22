'use client'

import { useMap } from 'react-leaflet'
import { FiCrosshair, FiMinus, FiPlus } from 'react-icons/fi'
import { useSimulationStore } from '@/store/simulationStore'
import { pointToLeaflet } from '@/map/leafletCoords'

export default function MapMapControls() {
  const map = useMap()
  const follow = useSimulationStore((s) => s.followVehicle)
  const setFollow = useSimulationStore((s) => s.setFollowVehicle)
  const setMapUserPanned = useSimulationStore((s) => s.setMapUserPanned)
  const vehicle = useSimulationStore((s) => s.state?.vehicles[0])

  const recenter = () => {
    if (vehicle?.active) {
      map.flyTo(pointToLeaflet(vehicle.lng, vehicle.lat), 15, { duration: 0.8 })
    }
    setMapUserPanned(false)
    setFollow(true)
  }

  return (
    <div className="map-floating-controls">
      <button
        type="button"
        className="map-ctrl-btn"
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
      >
        <FiPlus size={18} />
      </button>
      <button
        type="button"
        className="map-ctrl-btn"
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
      >
        <FiMinus size={18} />
      </button>
      <button
        type="button"
        className={`map-ctrl-btn ${follow ? 'map-ctrl-active' : ''}`}
        onClick={recenter}
        title="Follow vehicle"
        aria-label="Follow vehicle"
      >
        <FiCrosshair size={18} />
      </button>
    </div>
  )
}
