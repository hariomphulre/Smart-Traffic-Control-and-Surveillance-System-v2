'use client'

import { FiAlertTriangle } from 'react-icons/fi'
import type { TrafficState } from '@/lib/api'

export type LaneId = 1 | 2 | 3 | 4

interface SignalLanePanelProps {
  lane: LaneId
  state: TrafficState | null
  compact?: boolean
}

export default function SignalLanePanel({ lane, state, compact = false }: SignalLanePanelProps) {
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

  const lightSize = compact ? 'w-7 h-7' : 'w-8 h-8'
  const bodyClass = compact
    ? 'w-14 h-36 rounded-2xl bg-black border-2 border-[#1f2937] flex flex-col items-center justify-around py-2 shadow-lg'
    : 'w-16 h-40 rounded-3xl bg-black border-4 border-[#1f2937] flex flex-col items-center justify-around py-3 shadow-lg'
  const countdownClass = compact
    ? 'px-3 py-1 rounded-lg bg-black text-[#00ff5b] font-mono text-xl tracking-widest shadow-inner'
    : 'px-4 py-2 rounded-lg bg-black text-[#00ff5b] font-mono text-3xl tracking-widest shadow-inner'

  return (
    <div className={`flex flex-col items-center gap-3 ${compact ? 'w-full' : ''}`}>
      <div className="flex items-center justify-between w-full gap-2">
        <h2
          className={`font-medium text-[#202124] dark:text-[#e8eaed] ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          {/* Signal {lane} */}
        </h2>
        {ambulanceOn && (
          <div
            className={`flex items-center gap-1 font-medium text-[#d93025] dark:text-[#f28b82] ${
              compact ? 'text-[10px]' : 'text-xs'
            } animate-pulse`}
            title="Emergency — ambulance priority"
          >
            <FiAlertTriangle
              className={`${compact ? 'w-4 h-4' : 'w-3 h-3'} drop-shadow-[0_0_6px_rgba(217,48,37,0.9)]`}
            />
            <span>Emergency</span>
          </div>
        )}
      </div>

      <div className={countdownClass}>{formatCountdown()}</div>

      <div className={bodyClass}>
        <div
          className={`${lightSize} rounded-full transition-all duration-200 ${
            redOn ? 'bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.9)]' : 'bg-red-900/40'
          }`}
        />
        <div
          className={`${lightSize} rounded-full transition-all duration-200 ${
            yellowOn ? 'bg-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.9)]' : 'bg-yellow-900/40'
          }`}
        />
        <div
          className={`${lightSize} rounded-full transition-all duration-200 ${
            greenOn ? 'bg-green-600 shadow-[0_0_12px_rgba(34,197,94,0.9)]' : 'bg-green-900/40'
          }`}
        />
      </div>

      <div className="w-full">
        {/* <div className="h-2 rounded-full bg-[#1f2937] relative overflow-hidden">
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
        </div> */}
        <p
          className={`text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide text-center ${
            compact ? 'text-[12px]' : 'text-[10px]'
          }`}
        >
          {greenOn ? 'Go' : redOn ? 'Stop' : yellowOn ? 'Ready' : 'Idle'}
        </p>
      </div>
    </div>
  )
}
