'use client'

import { useMemo } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { emitOverride, emitTrafficUpdate } from '@/services/socket'
import { signalColor } from '@/utils/mapColors'
import { haversineM } from '@/utils/emergencyFormat'
import type { Intersection } from '@/types/emergency'
import { FiClock } from 'react-icons/fi'
import SetupSignalsPanel from '@/components/emergency/SetupSignalsPanel'

const OVERRIDE_RADIUS_M = 1000

export default function RightControlPanel() {
  const state = useSimulationStore((s) => s.state)
  const vehicle = state?.vehicles[0]
  const selectedId = useSimulationStore((s) => s.selectedIntersectionId)
  const setupMode = useSimulationStore((s) => s.setupMode)
  const running = state?.running ?? false

  const selected = state?.intersections.find((i) => i.id === selectedId)

  const aheadSignals = useMemo(() => {
    if (!state || !vehicle?.active || setupMode) return []
    return state.intersections
      .filter((i) => vehicle.routeNodeIds.includes(i.id))
      .map((int) => ({
        int,
        dist: haversineM(vehicle.lat, vehicle.lng, int.lat, int.lng),
      }))
      .filter((x) => x.dist <= 2000)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 6)
  }, [state, vehicle, setupMode])

  const selectedDist =
    vehicle && selected
      ? haversineM(vehicle.lat, vehicle.lng, selected.lat, selected.lng)
      : null
  const canOverrideSelected =
    selectedDist !== null && selectedDist <= OVERRIDE_RADIUS_M

  return (
    <aside className="ops-panel ops-panel-right">
      <header className="ops-panel-header">
        <p className="ops-eyebrow">Signals & Road Traffic</p>
        <h2 className="ops-title-sm">
          {setupMode && !running ? 'Setup mode' : 'Control panel'}
        </h2>
      </header>

      <div className="ops-panel-scroll">
        {setupMode && !running ? (
          <SetupSignalsPanel />
        ) : (
          <>
            {selected && (
              <section className="ops-section">
                <SignalDetailPanel
                  intersection={selected}
                  distanceM={selectedDist}
                  canOverride={running ? canOverrideSelected : false}
                  showDensity={running}
                />
              </section>
            )}

            {vehicle?.active && aheadSignals.length > 0 && (
              <section className="ops-section">
                <p className="ops-section-label">Lights on your route</p>
                <div className="ops-signal-queue">
                  {aheadSignals.map(({ int, dist }) => (
                    <SignalRow
                      key={int.id}
                      int={int}
                      dist={dist}
                      selectedId={selectedId}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="ops-section">
              <p className="ops-section-label">Logs</p>
              <div className="ops-log">
                {(state?.eventLogs ?? []).length === 0 ? (
                  <p className="ops-log-empty">Nothing yet</p>
                ) : (
                  state!.eventLogs.map((log) => (
                    <div key={log.id} className={`ops-log-line ops-log-${log.level}`}>
                      <FiClock size={11} className="shrink-0 opacity-50" />
                      <span className="ops-log-time">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span>{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </aside>
  )
}

function SignalRow({
  int,
  dist,
  selectedId,
}: {
  int: Intersection
  dist: number
  selectedId: string | null
}) {
  const setSelected = useSimulationStore((s) => s.setSelectedIntersection)
  return (
    <button
      type="button"
      onClick={() => setSelected(int.id)}
      className={`ops-signal-row w-full ${selectedId === int.id ? 'ops-signal-row-active' : ''}`}
    >
      <div>
        <span className="ops-signal-name">{int.name}</span>
        <span className="ops-signal-dist">{(dist / 1000).toFixed(2)} km away</span>
      </div>
      <PhaseSummary int={int} />
    </button>
  )
}

function SignalDetailPanel({
  intersection: int,
  distanceM,
  canOverride,
  showDensity,
}: {
  intersection: Intersection
  distanceM: number | null
  canOverride: boolean
  showDensity: boolean
}) {
  return (
    <div className="ops-signal-detail">
      <div className="ops-signal-detail-head">
        <h3>{int.name}</h3>
        {distanceM !== null && (
          <span className="ops-signal-dist">
            {distanceM < 1000
              ? `${Math.round(distanceM)} m away`
              : `${(distanceM / 1000).toFixed(2)} km away`}
          </span>
        )}
      </div>

      <div className="ops-detail-badges">
        {int.greenCorridorActive && (
          <span className="badge badge-corridor">Clear path</span>
        )}
        {int.overrideActive && (
          <span className="badge badge-override">Changed by hand</span>
        )}
      </div>

      <div className="ops-phase-grid">
        {(['north', 'south', 'east', 'west'] as const).map((dir) => {
          const sig = int[dir]
          return (
            <div key={dir} className="ops-phase-cell">
              <span className="ops-phase-dir">{dir[0].toUpperCase()}</span>
              <span
                className="ops-phase-state"
                style={{ color: signalColor(sig.state) }}
              >
                {sig.state}
              </span>
              <span className="ops-phase-count">{sig.countdown}s</span>
            </div>
          )
        })}
      </div>

      {showDensity && (
        <div className="ops-density-control">
          <label>Traffic level · {Math.round(int.trafficDensity)}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(int.trafficDensity)}
            onChange={(e) =>
              emitTrafficUpdate({
                intersectionId: int.id,
                density: Number(e.target.value),
              })
            }
          />
        </div>
      )}

      {canOverride && (
        <div className="ops-override-grid">
          <button
            type="button"
            className="ops-btn ops-btn-ghost text-xs"
            onClick={() => emitOverride(int.id, 'green')}
          >
            Turn green
          </button>
          <button
            type="button"
            className="ops-btn ops-btn-ghost text-xs"
            onClick={() => emitOverride(int.id, 'extend-green')}
          >
            Keep green longer
          </button>
          <button
            type="button"
            className="ops-btn ops-btn-ghost text-xs col-span-2"
            onClick={() => emitOverride(int.id, 'emergency')}
          >
            Open path now
          </button>
        </div>
      )}
    </div>
  )
}

function PhaseSummary({ int }: { int: Intersection }) {
  const dirs = [int.north, int.south, int.east, int.west]
  return (
    <div className="ops-phase-dots">
      {dirs.map((d, i) => (
        <span
          key={i}
          className="ops-phase-dot"
          style={{ backgroundColor: signalColor(d.state) }}
          title={`${d.state} ${d.countdown}s`}
        />
      ))}
    </div>
  )
}
