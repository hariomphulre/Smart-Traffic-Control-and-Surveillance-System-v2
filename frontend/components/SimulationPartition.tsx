'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FiAlertTriangle, FiPause, FiPlay, FiRotateCw } from 'react-icons/fi'
import { FaAmbulance, FaFireAlt, FaCarCrash } from 'react-icons/fa'
import { PiFireTruckFill } from 'react-icons/pi'
import type { TrafficState } from '@/lib/api'
import {
  getSimulationVideoUrl,
  type SimulationVideo,
} from '@/lib/simulation-videos'
import SignalLanePanel, { type LaneId } from '@/components/SignalLanePanel'

const PANEL_BORDER = 'border-[#dadce0] dark:border-[#3c4043]'

const EMERGENCY_ICONS = [
  { label: 'Ambulance', Icon: FaAmbulance },
  { label: 'Fire brigade', Icon: PiFireTruckFill },
  { label: 'Fire', Icon: FaFireAlt },
  { label: 'Accident', Icon: FaCarCrash },
] as const

interface SimulationPartitionProps {
  lane: LaneId
  selectedVideo: string
  state: TrafficState | null
  usedVideos: string[]
  availableVideos: SimulationVideo[]
  onVideoChange: (lane: LaneId, file: string) => void
}

export default function SimulationPartition({
  lane,
  selectedVideo,
  state,
  usedVideos,
  availableVideos,
  onVideoChange,
}: SimulationPartitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.load()
    setIsPlaying(false)
    setVideoError(false)
  }, [selectedVideo])

  const togglePlay = useCallback(async () => {
    const video = videoRef.current
    if (!video || videoError) return
    try {
      if (video.paused) {
        await video.play()
        setIsPlaying(true)
      } else {
        video.pause()
        setIsPlaying(false)
      }
    } catch {
      setIsPlaying(false)
    }
  }, [videoError])

  const reloadVideo = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.currentTime = 0
    video.load()
    setIsPlaying(false)
    setVideoError(false)
  }, [])

  const handleSelect = (file: string) => {
    if (usedVideos.includes(file) && file !== selectedVideo) return
    onVideoChange(lane, file)
  }

  const videoUrl = getSimulationVideoUrl(selectedVideo)
  const trafficCount =
    state && typeof state[`T${lane}`] === 'number' ? (state[`T${lane}`] as number) : null
  const heavyTraffic = trafficCount !== null && trafficCount > 5

  return (
    <div className="gcloud-card p-3 h-full flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <h2 className="text-sm font-medium text-[#202124] dark:text-[#e8eaed]">
            Camera {lane}
          </h2>
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-sm text-[#5f6368] dark:text-[#9aa0a6] bg-[#f8f9fa] dark:bg-[#292a2d] border-[#dadce0] dark:border-[#3c4043]">
            Traffic:{' '}
            <span className="font-semibold text-[#1a73e8] dark:text-[#8ab4f8] tabular-nums">
              {trafficCount ?? '—'}
            </span>
          </span>
          {heavyTraffic && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">
              <FiAlertTriangle className="w-3 h-3 shrink-0" />
              Heavy traffic
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            <span className="whitespace-nowrap">Video</span>
            <select
              value={selectedVideo}
              onChange={(e) => handleSelect(e.target.value)}
              className="text-sm rounded border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#35363a] text-[#202124] dark:text-[#e8eaed] px-2 py-1.5 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/40"
            >
              {availableVideos.length === 0 ? (
                <option disabled>No videos available</option>
              ) : (
                availableVideos.map((v: SimulationVideo) => {
                  const taken = usedVideos.includes(v.file) && v.file !== selectedVideo
                  return (
                    <option key={v.id} value={v.file} disabled={taken}>
                      {v.label}
                      {taken ? ' (in use)' : ''}
                    </option>
                  )
                })
              )}
            </select>
          </label>
          <button
            type="button"
            onClick={reloadVideo}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-md border ${PANEL_BORDER} text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors`}
            title="Reload video from start"
            aria-label="Reload video from start"
          >
            <FiRotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1">
        <div
          className="relative w-full max-w-[500px] h-[300px] shrink-0 mx-auto lg:mx-0 rounded-lg overflow-hidden bg-[#111827] border border-[#dadce0] dark:border-[#3c4043]"
        >
          <video
            ref={videoRef}
            key={selectedVideo}
            src={videoUrl}
            className="w-full h-full object-cover"
            playsInline
            loop
            muted
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              setVideoError(true)
              setIsPlaying(false)
            }}
          />

          {videoError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-[#f28b82] px-4 text-center">
              Could not load video. Ensure ml_service/videos is available.
            </div>
          ) : (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              <span
                className={`flex items-center justify-center w-16 h-16 rounded-full bg-white/90 text-[#1a73e8] shadow-lg transition-transform group-hover:scale-105 ${
                  isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                }`}
              >
                {isPlaying ? (
                  <FiPause className="w-8 h-8" />
                ) : (
                  <FiPlay className="w-8 h-8 ml-1" />
                )}
              </span>
            </button>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
          <div className={`gcloud-card p-3 max-w-[100px] border ${PANEL_BORDER}`}>
            <SignalLanePanel lane={lane} state={state} compact />
          </div>
          <div className="flex flex-col items-center justify-center gap-3 shrink-0">
            {EMERGENCY_ICONS.map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                disabled
                aria-label={label}
                className={`group relative flex items-center justify-center rounded-xl border p-2 ${PANEL_BORDER} cursor-default`}
              >
                <Icon className="w-5 h-5 text-[#9aa0a6] dark:text-[#80868b]" />
                <span
                  className={`pointer-events-none absolute left-full ml-2 z-10 whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-medium text-[#202124] dark:text-[#e8eaed] bg-white dark:bg-[#35363a] border opacity-0 transition-opacity group-hover:opacity-100 ${PANEL_BORDER}`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
