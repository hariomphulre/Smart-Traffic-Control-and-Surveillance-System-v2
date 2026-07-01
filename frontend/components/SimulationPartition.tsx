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
import { IoMdRefresh } from 'react-icons/io'

const PANEL_BORDER = 'border-[#dadce0] dark:border-[#3c4043]'

/** Wait until FFmpeg has written a playlist that references at least one .ts segment. */
async function waitForLivePlaylist(
  url: string,
  isCancelled: () => boolean,
  timeoutMs = 90_000
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline && !isCancelled()) {
    try {
      const res = await fetch(`${url}?_=${Date.now()}`, { cache: 'no-store' })
      if (res.ok) {
        const body = await res.text()
        if (body.includes('#EXTINF') && body.includes('.ts')) {
          return true
        }
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  return false
}

const EMERGENCY_ICONS = [
  { label: 'Ambulance', Icon: FaAmbulance },
  { label: 'Fire brigade', Icon: PiFireTruckFill },
  { label: 'Fire', Icon: FaFireAlt },
  { label: 'Accident', Icon: FaCarCrash },
] as const

interface SimulationPartitionProps {
  lane: LaneId
  /** Video chosen in dropdown (editable only when not running) */
  selectedVideo: string
  /** Frozen at Run — stream and label use this so video does not switch mid-run */
  lockedVideo?: string
  state: TrafficState | null
  streamUrl?: string
  streamStartedAt?: number
  simulationRunning?: boolean
  usedVideos: string[]
  availableVideos: SimulationVideo[]
  onVideoChange: (lane: LaneId, file: string) => void
}

export default function SimulationPartition({
  lane,
  selectedVideo,
  lockedVideo,
  state,
  streamUrl,
  streamStartedAt,
  simulationRunning = false,
  usedVideos,
  availableVideos,
  onVideoChange,
}: SimulationPartitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<{ destroy: () => void } | null>(null)
  const livePlayingRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [streamLoading, setStreamLoading] = useState(false)
  const [streamStalled, setStreamStalled] = useState(false)

  const activeVideoFile = simulationRunning && lockedVideo ? lockedVideo : selectedVideo
  const showLiveStream = simulationRunning && Boolean(streamUrl)

  // No stream URL while running → pipeline failed for this partition
  useEffect(() => {
    if (simulationRunning && !streamUrl) {
      setVideoError(true)
      setStreamLoading(false)
    }
  }, [simulationRunning, streamUrl])

  // Preview mode: static MP4 from API
  useEffect(() => {
    if (simulationRunning) return
    const video = videoRef.current
    if (!video) return

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    video.pause()
    video.removeAttribute('src')
    video.load()
    video.src = getSimulationVideoUrl(selectedVideo)
    video.load()
    setIsPlaying(false)
    setVideoError(false)
    setStreamLoading(false)
  }, [simulationRunning, selectedVideo])

  // Live mode: wait for HLS manifest, then autoplay (no extra click)
  useEffect(() => {
    if (!simulationRunning || !streamUrl) {
      setStreamLoading(false)
      return
    }

    const video = videoRef.current
    if (!video) return

    let cancelled = false
    const isCancelled = () => cancelled
    setStreamLoading(true)
    setVideoError(false)
    setStreamStalled(false)

    livePlayingRef.current = false
    const onPlaying = () => {
      if (cancelled) return
      livePlayingRef.current = true
      setStreamLoading(false)
      setStreamStalled(false)
      setIsPlaying(true)
    }

    const playNativeHls = () => {
      video.src = streamUrl
      video.addEventListener('playing', onPlaying, { once: true })
      void video.play().catch(() => {
        /* autoplay may need muted — already muted */
      })
    }

    const stallTimer = window.setTimeout(() => {
      if (!cancelled && !livePlayingRef.current) {
        setStreamStalled(true)
      }
    }, 90_000)

    const startLive = async () => {
      const ready = await waitForLivePlaylist(streamUrl, isCancelled)
      if (cancelled) return
      if (!ready) {
        setVideoError(true)
        setStreamLoading(false)
        return
      }

      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }

      let HlsCtor: typeof import('hls.js').default | null = null
      try {
        HlsCtor = (await import('hls.js')).default
      } catch {
        HlsCtor = null
      }
      if (cancelled) return

      video.addEventListener('playing', onPlaying)

      if (HlsCtor?.isSupported()) {
        const player = new HlsCtor({
          enableWorker: true,
          lowLatencyMode: true,
          liveSyncDurationCount: 2,
          liveMaxLatencyDurationCount: 5,
          maxLiveSyncPlaybackRate: 1.5,
          manifestLoadingTimeOut: 20_000,
          manifestLoadingMaxRetry: 12,
          levelLoadingMaxRetry: 6,
          fragLoadingMaxRetry: 6,
        })
        hlsRef.current = player
        player.loadSource(`${streamUrl}?run=${streamStartedAt ?? Date.now()}`)
        player.attachMedia(video)
        player.on(HlsCtor.Events.MANIFEST_PARSED, () => {
          if (cancelled) return
          void video.play().catch(() => undefined)
        })
        let fatalRetries = 0
        player.on(HlsCtor.Events.ERROR, (_event: string, data) => {
          if (cancelled || !data.fatal) return
          if (data.type === HlsCtor!.ErrorTypes.NETWORK_ERROR && fatalRetries < 8) {
            fatalRetries += 1
            player.startLoad()
            return
          }
          if (data.type === HlsCtor!.ErrorTypes.MEDIA_ERROR && fatalRetries < 4) {
            fatalRetries += 1
            player.recoverMediaError()
            return
          }
          setVideoError(true)
          setStreamLoading(false)
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        playNativeHls()
      } else {
        setVideoError(true)
        setStreamLoading(false)
      }
    }

    void startLive()

    return () => {
      cancelled = true
      window.clearTimeout(stallTimer)
      video.removeEventListener('playing', onPlaying)
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      // Do not clear video.src here — React strict mode remount caused blank panels
    }
  }, [simulationRunning, streamUrl, streamStartedAt])

  const togglePlay = useCallback(async () => {
    if (simulationRunning) return
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
  }, [simulationRunning, videoError])

  const reloadVideo = useCallback(() => {
    if (simulationRunning) return
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.currentTime = 0
    video.load()
    setIsPlaying(false)
    setVideoError(false)
  }, [simulationRunning])

  const handleSelect = (file: string) => {
    if (simulationRunning) return
    if (usedVideos.includes(file) && file !== selectedVideo) return
    onVideoChange(lane, file)
  }

  const trafficCount =
    state && typeof state[`T${lane}`] === 'number' ? (state[`T${lane}`] as number) : null
  const heavyTraffic = trafficCount !== null && trafficCount > 5

  const selectValue = activeVideoFile

  return (
    <div className="bg-[#131314] border-r border-b border-[#3c4043] p-3 h-full flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <h2 className="text-sm font-medium text-[#202124] dark:text-[#e8eaed]">
            Camera {lane}
          </h2>
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-sm text-[#5f6368] dark:text-[#9aa0a6] bg-[#f8f9fa] dark:bg-[#060606] border-[#dadce0] dark:border-[#3c4043]">
            Traffic:{' '}
            <span className="font-semibold text-[#1a73e8] dark:text-[#8ab4f8] tabular-nums">
              {trafficCount ?? '—'}
            </span>
          </span>
          {heavyTraffic && (
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-sm text-[#5f6368] dark:text-[#9aa0a6] bg-[#f8f9fa] dark:bg-[#292a2d] border-[#dadce0] dark:border-[#3c4043]">
              <FiAlertTriangle className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
              Heavy traffic
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label
            className={`flex items-center gap-2 text-xs ${
              simulationRunning
                ? 'text-[#9aa0a6] dark:text-[#80868b] cursor-not-allowed'
                : 'text-[#5f6368] dark:text-[#9aa0a6]'
            }`}
          >
            <span className="whitespace-nowrap">Video</span>
            <select
              value={selectValue}
              disabled={simulationRunning}
              onChange={(e) => handleSelect(e.target.value)}
              className={`text-sm rounded border px-2 py-1.5 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/40 ${
                simulationRunning
                  ? 'cursor-not-allowed border-[#e8eaed] dark:border-[#3c4043] bg-[#f1f3f4] dark:bg-[#2d2e31] text-[#9aa0a6] dark:text-[#80868b] opacity-90'
                  : 'border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#35363a] text-[#202124] dark:text-[#e8eaed]'
              }`}
            >
              {availableVideos.length === 0 ? (
                <option disabled>No videos available</option>
              ) : (
                availableVideos.map((v: SimulationVideo) => {
                  const taken =
                    !simulationRunning &&
                    usedVideos.includes(v.file) &&
                    v.file !== selectedVideo
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
            disabled={simulationRunning}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-md border ${PANEL_BORDER} text-[#5f6368] dark:text-[#9aa0a6] transition-colors ${
              simulationRunning
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]'
            }`}
            title="Reload video from start"
            aria-label="Reload video from start"
          >
            <IoMdRefresh className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1">
        <div className="relative w-full max-w-[500px] h-[300px] shrink-0 mx-auto lg:mx-0 rounded-lg overflow-hidden bg-[#111827] border border-[#dadce0] dark:border-[#3c4043]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay={showLiveStream}
            loop={!showLiveStream}
            muted
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              // Clearing src when switching preview ↔ live can fire spurious errors
              if (simulationRunning && streamUrl) return
              setVideoError(true)
              setIsPlaying(false)
              setStreamLoading(false)
            }}
          />

          {streamLoading && simulationRunning && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white px-4 text-center">
              Starting live stream…
            </div>
          )}

          {streamStalled && simulationRunning && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-amber-200 px-4 text-center">
              Stream is slow to start. Wait or check{' '}
              <code className="text-xs">docker compose logs ml-service</code>.
            </div>
          )}

          {videoError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-[#f28b82] px-4 text-center">
              Could not load live stream. Ensure ml_service is running, rebuild the image
              after dependency changes, and wait for detection to start.
            </div>
          ) : !simulationRunning ? (
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
          ) : null}
        </div>

        <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
          <div className={`gcloud-card !bg-[#131314] p-3 max-w-[100px] border ${PANEL_BORDER}`}>
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
                  className={`pointer-events-none absolute left-full ml-2 z-10 whitespace-nowrap rounded px-2 py-0.5 text-[12px] font-medium text-[#202124] dark:text-[#e8eaed] bg-white dark:bg-black border opacity-0 transition-opacity group-hover:opacity-100 ${PANEL_BORDER}`}
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
