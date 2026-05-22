'use client'

import { useSimulationStore } from '@/store/simulationStore'
import { emitStart, emitStop, emitReset, emitResume } from '@/services/socket'
import {
  formatEta,
  formatDistance,
  formatSpeed,
  missionStatus,
  missionStatusClass,
} from '@/utils/emergencyFormat'
import { FiPlay, FiSquare, FiRotateCcw, FiSliders, FiSkipForward } from 'react-icons/fi'
import { FaPlusSquare } from "react-icons/fa";
import { FaPlusCircle } from "react-icons/fa";

export default function LeftSidebar() {
  const vehicleType = useSimulationStore((s) => s.vehicleType)
  const connected = useSimulationStore((s) => s.connected)
  const state = useSimulationStore((s) => s.state)
  const setupMode = useSimulationStore((s) => s.setupMode)
  const setSetupMode = useSimulationStore((s) => s.setSetupMode)
  const hasStarted = useSimulationStore((s) => s.hasStarted)
  const setHasStarted = useSimulationStore((s) => s.setHasStarted)
  const vehicle = state?.vehicles[0]

  const running = state?.running ?? false
  const canResume = hasStarted && !running && (vehicle?.active ?? false)
  const canStart = !running && !hasStarted

  const status = missionStatus(running, vehicle?.active ?? false, vehicle?.progress ?? 0)
  const statusClass = missionStatusClass(status)
  const progressPct = vehicle ? Math.round(vehicle.progress * 100) : 0

  const handleStart = () => {
    setHasStarted(true)
    setSetupMode(false)
    emitStart(vehicleType)
  }

  const handleResume = () => {
    setSetupMode(false)
    emitResume()
  }

  const handleReset = () => {
    setHasStarted(false)
    setSetupMode(false)
    emitReset()
  }

  return (
    <aside className="ops-panel ops-panel-left">
      <header className="ops-panel-header">
        <p className="ops-eyebrow pb-1">Emergency Response System</p>
        <div className="flex items-center gap-2">
          <FaPlusCircle className="text-2xl text-red-300 bg-red-500/10 w-4 h-4 mb-1" />
          <h1 className="ops-title">Ambulance</h1>
          <div className="ops-connection pl-2">
            <span className={`ops-dot ${connected ? 'ops-dot-live' : 'ops-dot-off'}`} />
            <span>{connected ? 'Connected' : 'Not connected'}</span>
          </div>
        </div>
      </header>

      <section className="ops-section">
        <p className="ops-section-label">Controls</p>
        <div className="ops-actions">
          {canStart && (
            <button
              type="button"
              onClick={handleStart}
              disabled={!connected || setupMode}
              className="ops-btn ops-btn-primary"
            >
              <FiPlay size={16} />
              Start
            </button>
          )}
          {canResume && (
            <button
              type="button"
              onClick={handleResume}
              disabled={!connected}
              className="ops-btn ops-btn-primary"
            >
              <FiSkipForward size={16} />
              Resume
            </button>
          )}
          <button
            type="button"
            onClick={() => emitStop()}
            disabled={!running}
            className="ops-btn ops-btn-danger"
          >
            <FiSquare size={16} />
            Stop
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={running}
            className="ops-btn ops-btn-ghost"
          >
            <FiRotateCcw size={16} />
            Reset map
          </button>
          <button
            type="button"
            onClick={() => setSetupMode(!setupMode)}
            disabled={running}
            className={`ops-btn ops-btn-ghost ${setupMode ? 'ops-btn-setup-active' : ''}`}
          >
            <FiSliders size={16} />
            Setup signals & traffic
          </button>
        </div>
        {setupMode && !running && (
          <p className="ops-hint-text pt-3">
            Setup mode on - use the right panel or map to change lights, timers, and road
            traffic. Then press Start.
          </p>
        )}
      </section>

      <section className="ops-section ops-section-grow">
        <div className="ops-mission-card">
          <div className="ops-mission-top">
            <span className="ops-section-label">Trip</span>
            <span className={`ops-status ops-status-${statusClass}`}>{status}</span>
          </div>

          {vehicle ? (
            <>
              <p className="ops-dest">
                To: <strong>{vehicle.targetPoiName}</strong>
              </p>
              <p className="ops-hint-text">
                Starts at top of map → hospital at bottom
              </p>

              <div className="ops-progress-wrap">
                <div className="ops-progress-meta">
                  <span>Trip done</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="ops-progress-bar">
                  <div
                    className="ops-progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="ops-kpi-grid">
                <Kpi label="Time left" value={formatEta(vehicle.etaSeconds)} highlight />
                <Kpi label="Speed" value={formatSpeed(vehicle.speed)} />
                <Kpi label="Distance left" value={formatDistance(vehicle.distanceRemaining)} />
                <Kpi
                  label="Green lights"
                  value={String(state?.greenCorridorIds.length ?? 0)}
                  sub="opened for you"
                />
              </div>
            </>
          ) : (
            <p className="ops-idle">
              {setupMode
                ? 'Set up lights and traffic on the right, then press Start.'
                : 'Press Start to run the ambulance on a live route.'}
            </p>
          )}
        </div>

        {(state?.activeOverrides.length ?? 0) > 0 && (
          <div className="ops-alert ops-alert-warn">
            {state!.activeOverrides.length} light
            {state!.activeOverrides.length > 1 ? 's' : ''} changed by hand
          </div>
        )}
      </section>
    </aside>
  )
}

function Kpi({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={`ops-kpi ${highlight ? 'ops-kpi-highlight' : ''}`}>
      <span className="ops-kpi-label">{label}</span>
      <span className="ops-kpi-value">{value}</span>
      {sub && <span className="ops-kpi-sub">{sub}</span>}
    </div>
  )
}
