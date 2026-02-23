'use client'

import { useEffect, useState } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import { getTrafficState, type TrafficState } from '@/lib/api'

type LaneId = 1 | 2 | 3 | 4

interface LaneViewProps {
  lane: LaneId
  state: TrafficState | null
}

function LaneView({ lane, state }: LaneViewProps) {
  const redOn = state ? Boolean(state[`R${lane}`]) : lane === 1
  const yellowOn = state ? Boolean(state[`Y${lane}`]) : false
  const greenOn = state ? Boolean(state[`G${lane}`]) : false
  const ambulanceOn = state ? Boolean(state[`A${lane}`]) : false
  const laneCountdownRaw =
    state && typeof state[`C${lane}`] === 'number' ? (state[`C${lane}`] as number) : null
  const globalCountdownRaw = state && typeof state.C === 'number' ? state.C : null
  const countdownRaw = laneCountdownRaw ?? globalCountdownRaw
  const countdown = countdownRaw !== null && countdownRaw >= 0 ? countdownRaw : null
  const trafficCount =
    state && typeof state[`T${lane}`] === 'number' ? (state[`T${lane}`] as number) : null

  const formatCountdown = () => {
    if (countdown === null) return '--'
    if (countdown > 99) return '99'
    if (countdown < 0) return '00'
    return countdown.toString().padStart(2, '0')
  }

  return (
    <div className="gcloud-card p-4 flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-sm font-medium text-[#202124] dark:text-[#e8eaed]">
          Signal {lane}
        </h2>
        {ambulanceOn && (
          <div className="flex items-center gap-1 text-xs font-medium text-[#d93025] dark:text-[#f28b82]">
            <FiAlertTriangle className="w-3 h-3" />
            <span>Ambulance</span>
          </div>
        )}
      </div>

      {/* Digital countdown */}
      <div className="px-4 py-2 rounded-lg bg-black text-[#00ff5b] font-mono text-3xl tracking-widest shadow-inner">
        {formatCountdown()}
      </div>

      {trafficCount !== null && (
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1">
          Traffic count T{lane}: <span className="font-medium text-[#202124] dark:text-[#e8eaed]">{trafficCount}</span>
        </p>
      )}

      {/* Traffic light body */}
      <div className="mt-2 w-16 h-40 rounded-3xl bg-[#111827] border-4 border-[#1f2937] flex flex-col items-center justify-around py-3 shadow-lg">
        <div
          className={`w-8 h-8 rounded-full transition-all duration-200 ${
            redOn ? 'bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.9)]' : 'bg-red-900/40'
          }`}
        />
        <div
          className={`w-8 h-8 rounded-full transition-all duration-200 ${
            yellowOn ? 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)]' : 'bg-yellow-900/40'
          }`}
        />
        <div
          className={`w-8 h-8 rounded-full transition-all duration-200 ${
            greenOn ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.9)]' : 'bg-green-900/40'
          }`}
        />
      </div>

      {/* Lane indicator with red/green line */}
      <div className="mt-3 w-full">
        <div className="h-3 rounded-full bg-[#1f2937] relative overflow-hidden">
          <div
            className={`absolute inset-y-0 left-1 right-1 rounded-full transition-all duration-200 ${
              greenOn
                ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.9)]'
                : redOn
                ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.9)]'
                : yellowOn
                ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.9)]'
                : 'bg-transparent'
            }`}
          />
        </div>
        <p className="mt-1 text-[10px] text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide text-center">
          {greenOn ? 'Go' : redOn ? 'Stop' : yellowOn ? 'Ready' : 'Idle'}
        </p>
      </div>
    </div>
  )
}

export default function SignalsPage() {
  const [state, setState] = useState<TrafficState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchState = async () => {
      try {
        const data = await getTrafficState()
        if (!cancelled) {
          setState(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Unable to fetch signal state')
        }
      }
    }

    // Initial fetch
    fetchState()

    // Poll every second to simulate live timers
    const id = setInterval(fetchState, 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="max-w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-1">
          Signal Simulation
        </h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
          Four-way junction with real-time digital countdown and signal states (R/Y/G).
        </p>
        {error && (
          <p className="mt-2 text-sm text-[#d93025] dark:text-[#f28b82]">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((lane) => (
          <LaneView key={lane} lane={lane as LaneId} state={state} />
        ))}
      </div>
    </div>
  )
}

