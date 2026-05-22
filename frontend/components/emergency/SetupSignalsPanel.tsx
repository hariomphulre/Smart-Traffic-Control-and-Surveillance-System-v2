'use client'

import { useSimulationStore } from '@/store/simulationStore'
import { emitTrafficUpdate, emitSignalConfigure, emitRoadBlock } from '@/services/socket'
import { signalColor } from '@/utils/mapColors'
import type { Intersection, RoadSegment, SignalColor } from '@/types/emergency'

export default function SetupSignalsPanel() {
  const state = useSimulationStore((s) => s.state)
  const selectedId = useSimulationStore((s) => s.selectedIntersectionId)
  const setSelected = useSimulationStore((s) => s.setSelectedIntersection)

  const intersections = state?.intersections ?? []
  const roads = state?.roads ?? []
  const selected = intersections.find((i) => i.id === selectedId)

  return (
    <div className="setup-panel">
      <p className="ops-section-label pt-2 pl-2">Crossings</p>
      <p className="setup-intro pl-2">
        Tap a crossing on the map or pick one below.
      </p>

      <div className="setup-list">
        {intersections.map((int) => (
          <button
            key={int.id}
            type="button"
            onClick={() => setSelected(int.id)}
            className={`ops-signal-row ${selectedId === int.id ? 'ops-signal-row-active' : ''}`}
          >
            <span className="ops-signal-name">{int.name}</span>
            <PhaseDots int={int} />
          </button>
        ))}
      </div>

      <div className="border-b-1 border-[#3e3f42]"></div>
      {selected && (
        <div className="ops-signal-detail mt-3">
          <h3 className="text-sm font-semibold mb-2">{selected.name}</h3>
          <p className="ops-section-label">Lights (N / S / E / W)</p>
          {(['north', 'south', 'east', 'west'] as const).map((dir) => (
            <DirectionEditor
              key={dir}
              intersectionId={selected.id}
              direction={dir}
              signal={selected[dir]}
            />
          ))}
          <div className="ops-density-control mt-3">
            <label>Traffic at crossing · {Math.round(selected.trafficDensity)}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(selected.trafficDensity)}
              onChange={(e) =>
                emitTrafficUpdate({
                  intersectionId: selected.id,
                  density: Number(e.target.value),
                })
              }
            />
          </div>
        </div>
      )}

      <p className="ops-section-label pt-2 pl-2">Roads</p>
      {roads.map((r) => (
        <RoadSetup key={r.id} road={r} />
      ))}
    </div>
  )
}

function DirectionEditor({
  intersectionId,
  direction,
  signal,
}: {
  intersectionId: string
  direction: 'north' | 'south' | 'east' | 'west'
  signal: { state: SignalColor; countdown: number }
}) {
  const label = direction.charAt(0).toUpperCase() + direction.slice(1)

  return (
    <div className="setup-dir-row">
      <span className="setup-dir-label" style={{ color: signalColor(signal.state) }}>
        {label}
      </span>
      <select
        value={signal.state}
        onChange={(e) =>
          emitSignalConfigure({
            intersectionId,
            direction,
            state: e.target.value as SignalColor,
          })
        }
        className="setup-select"
      >
        <option value="green">Green</option>
        <option value="yellow">Yellow</option>
        <option value="red">Red</option>
      </select>
      <div className="setup-countdown">
        <span className="text-xs text-[#9aa0a6]">{signal.countdown}s</span>
        <input
          type="range"
          min={1}
          max={60}
          value={signal.countdown}
          onChange={(e) =>
            emitSignalConfigure({
              intersectionId,
              direction,
              countdown: Number(e.target.value),
            })
          }
        />
      </div>
    </div>
  )
}

function RoadSetup({ road }: { road: RoadSegment }) {
  return (
    <div className="ops-road-row">
      <div className="ops-road-head">
        <span className="ops-road-name">{road.name}</span>
        <span className="ops-road-pct">{Math.round(road.trafficDensity)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(road.trafficDensity)}
        onChange={(e) =>
          emitTrafficUpdate({ roadId: road.id, density: Number(e.target.value) })
        }
      />
      <button
        type="button"
        className="ops-road-block"
        onClick={() => emitRoadBlock(road.id, !road.blocked)}
      >
        {road.blocked ? 'Open road' : 'Close road'}
      </button>
    </div>
  )
}

function PhaseDots({ int }: { int: Intersection }) {
  const dirs = [int.north, int.south, int.east, int.west]
  return (
    <div className="ops-phase-dots">
      {dirs.map((d, i) => (
        <span
          key={i}
          className="ops-phase-dot"
          style={{ backgroundColor: signalColor(d.state) }}
        />
      ))}
    </div>
  )
}
