'use client'

import type { Intersection, POI } from '@/types/emergency'
import { signalColor } from '@/utils/mapColors'

type Direction = 'north' | 'south' | 'east' | 'west'

const DIR_LABEL: Record<Direction, string> = {
  north: 'North',
  south: 'South',
  east: 'East',
  west: 'West',
}

export function IntersectionPopup({ int }: { int: Intersection }) {
  return (
    <div className="map-popup-card">
      <div className="map-popup-header">
        <div>
          <p className="map-popup-eyebrow">Traffic light</p>
          <h3 className="map-popup-title">{int.name}</h3>
        </div>
        <div className="map-popup-badges">
          {int.greenCorridorActive && (
            <span className="badge badge-corridor">Clear path</span>
          )}
          {int.overrideActive && <span className="badge badge-override">Manual</span>}
        </div>
      </div>

      <div className="map-popup-metrics">
        <Metric label="Traffic level" value={`${Math.round(int.trafficDensity)}%`} />
        <Metric label="How busy" value={`${Math.round(int.congestionScore)} / 100`} />
      </div>

      <div className="map-popup-signals">
        {(['north', 'south', 'east', 'west'] as Direction[]).map((dir) => {
          const sig = int[dir]
          return (
            <div key={dir} className="signal-row">
              <span className="signal-dir">{DIR_LABEL[dir]}</span>
              <div className="signal-row-right">
                <span
                  className="signal-state-pill"
                  style={{
                    color: signalColor(sig.state),
                    borderColor: `${signalColor(sig.state)}44`,
                    backgroundColor: `${signalColor(sig.state)}18`,
                  }}
                >
                  {sig.state}
                </span>
                <span className="signal-countdown">{sig.countdown}s</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PoiPopup({ poi }: { poi: POI }) {
  const isHospital = poi.type === 'hospital'
  return (
    <div className="map-popup-card">
      <div className="map-popup-header">
        <div>
          <p className="map-popup-eyebrow">{isHospital ? 'Going to' : 'Fire station'}</p>
          <h3 className="map-popup-title">{poi.name}</h3>
        </div>
        <span className={`badge ${isHospital ? 'badge-hospital' : 'badge-fire'}`}>
          {isHospital ? 'Hospital' : 'Fire'}
        </span>
      </div>
    </div>
  )
}

export function VehiclePopup({
  type,
  speed,
  etaSeconds,
  target,
}: {
  type: string
  speed: number
  etaSeconds: number
  target: string
}) {
  const label = type === 'ambulance' ? 'Ambulance' : 'Fire truck'
  return (
    <div className="map-popup-card">
      <div className="map-popup-header">
        <div>
          <p className="map-popup-eyebrow">{label}</p>
          <h3 className="map-popup-title">On the way</h3>
        </div>
      </div>
      <div className="map-popup-metrics">
        <Metric label="Speed" value={`${Math.round(speed)} km/h`} />
        <Metric label="Time left" value={formatEta(etaSeconds)} />
      </div>
      <p className="map-popup-dest">
        <span className="text-[#9aa0a6]">To: </span>
        {target}
      </p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-cell">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  )
}

function formatEta(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
