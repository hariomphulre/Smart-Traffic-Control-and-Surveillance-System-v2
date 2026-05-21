'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import SimulationPartition from '@/components/SimulationPartition'
import type { LaneId } from '@/components/SignalLanePanel'
import { getTrafficState, type TrafficState } from '@/lib/api'
import { getDefaultVideoByLane, getSimulationVideos, type SimulationVideo } from '@/lib/simulation-videos'
import {
  getSimulationStatus,
  runSimulation,
  stopSimulation,
  type SimulationPartitionStatus,
} from '@/lib/simulation'

const LANES: LaneId[] = [1, 2, 3, 4]

export default function SimulationPage() {
  const [state, setState] = useState<TrafficState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [availableVideos, setAvailableVideos] = useState<SimulationVideo[]>([])
  const [videoByLane, setVideoByLane] = useState<Record<LaneId, string>>({
    1: '',
    2: '',
    3: '',
    4: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [streamStatus, setStreamStatus] = useState<Record<LaneId, SimulationPartitionStatus>>({
    1: { running: false },
    2: { running: false },
    3: { running: false },
    4: { running: false },
  })
  /** Videos locked when Run was clicked — prevents stream/dropdown from switching mid-run */
  const [lockedVideos, setLockedVideos] = useState<Record<LaneId, string> | null>(null)
  const [wsUrl, setWsUrl] = useState<string | null>(null)
  /** Full traffic.json from WebSocket (partition scripts + simulation.py). */
  const [trafficLiveSnapshot, setTrafficLiveSnapshot] = useState<TrafficState | null>(null)

  // Load available videos and set defaults
  useEffect(() => {
    let cancelled = false

    const loadVideos = async () => {
      try {
        const videos = await getSimulationVideos()
        const defaults = await getDefaultVideoByLane()

        if (!cancelled) {
          setAvailableVideos(videos)
          setVideoByLane({
            1: defaults[1],
            2: defaults[2],
            3: defaults[3],
            4: defaults[4],
          })
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error loading videos:', err)
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadVideos()
    return () => {
      cancelled = true
    }
  }, [])

  // On load: restore stream URLs only (do not overwrite user video picks unless already running)
  useEffect(() => {
    getSimulationStatus()
      .then((status) => {
        const partitionStatus = status.status || {}
        setWsUrl(status.wsUrl || null)
        setStreamStatus({
          1: partitionStatus[1] || { running: false },
          2: partitionStatus[2] || { running: false },
          3: partitionStatus[3] || { running: false },
          4: partitionStatus[4] || { running: false },
        })
        const hasRunning = LANES.some((lane) => partitionStatus[lane]?.running)
        if (!hasRunning) return

        setIsRunning(true)
        const locked = {} as Record<LaneId, string>
        for (const lane of LANES) {
          const v = partitionStatus[lane]?.video
          if (typeof v === 'string' && v) locked[lane] = v
        }
        if (Object.keys(locked).length > 0) {
          setLockedVideos(locked)
          setVideoByLane((prev) => ({ ...prev, ...locked }))
        }
      })
      .catch(() => {
        // no-op
      })
  }, [])

  // Live traffic.json updates while simulation is running
  useEffect(() => {
    if (!isRunning || !wsUrl) {
      return
    }

    const ws = new WebSocket(wsUrl)
    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data) as TrafficState
        setTrafficLiveSnapshot(raw)
      } catch {
        // no-op
      }
    }
    return () => ws.close()
  }, [isRunning, wsUrl])

  const handleRun = useCallback(async () => {
    if (isRunning) return
    setIsStarting(true)
    setError(null)
    try {
      const locked = {
        1: videoByLane[1],
        2: videoByLane[2],
        3: videoByLane[3],
        4: videoByLane[4],
      } as Record<LaneId, string>
      setLockedVideos(locked)

      const response = await runSimulation({
        partitions: {
          1: { video: locked[1] },
          2: { video: locked[2] },
          3: { video: locked[3] },
          4: { video: locked[4] },
        },
      })
      const partitionStatus = response.status || {}
      const nextStatus = {
        1: partitionStatus[1] || { running: false },
        2: partitionStatus[2] || { running: false },
        3: partitionStatus[3] || { running: false },
        4: partitionStatus[4] || { running: false },
      }
      setStreamStatus(nextStatus)
      setWsUrl(response.wsUrl || null)
      const anyRunning = LANES.some((lane) => nextStatus[lane]?.running)
      if (!anyRunning) {
        setError('Simulation pipelines did not start. Check ml_service logs (docker compose logs ml-service).')
        setLockedVideos(null)
        setIsRunning(false)
        return
      }
      setIsRunning(true)
      setTrafficLiveSnapshot(null)
    } catch {
      setError('Unable to start simulation pipelines')
      setIsRunning(false)
    } finally {
      setIsStarting(false)
    }
  }, [isRunning, videoByLane])

  const handleStop = useCallback(async () => {
    setIsStopping(true)
    setError(null)
    try {
      await stopSimulation()
      setIsRunning(false)
      setLockedVideos(null)
      setWsUrl(null)
      setTrafficLiveSnapshot(null)
      setStreamStatus({
        1: { running: false },
        2: { running: false },
        3: { running: false },
        4: { running: false },
      })
    } catch {
      setError('Unable to stop simulation pipelines')
    } finally {
      setIsStopping(false)
    }
  }, [])

  // Load traffic state
  useEffect(() => {
    let cancelled = false

    const fetchState = async () => {
      try {
        const data = await getTrafficState()
        if (!cancelled) {
          setState(data)
          setError(null)
        }
      } catch {
        if (!cancelled) {
          setError('Unable to fetch signal state')
        }
      }
    }

    fetchState()
    const id = setInterval(fetchState, 500)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const handleVideoChange = useCallback(
    (lane: LaneId, file: string) => {
      if (isRunning) return
      setVideoByLane((prev) => ({ ...prev, [lane]: file }))
    },
    [isRunning]
  )

  const usedVideos = LANES.map((lane) => videoByLane[lane])

  const displayTrafficState = useMemo((): TrafficState | null => {
    if (isRunning && trafficLiveSnapshot) return trafficLiveSnapshot
    return state ?? trafficLiveSnapshot
  }, [isRunning, state, trafficLiveSnapshot])

  return (
    <div className="max-w-full px-4 py-3">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-normal text-[#202124] dark:text-[#e8eaed] mb-1">
            Live Simulation Demo
          </h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">
            Select the demo videos and click on 'Run' button to start the simulation. You can check other section, Live data will update.
          </p>
          {error && (
            <p className="mt-2 text-sm text-[#d93025] dark:text-[#f28b82]">{error}</p>
          )}
        </div>
        <div className="shrink-0 self-start sm:self-center flex items-center gap-2">
          <button
            type="button"
            onClick={handleRun}
            disabled={isStarting || isRunning || isStopping}
            className="rounded-md bg-[#1a73e8] hover:bg-[#1765cc] px-5 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#a8c7fa] disabled:text-white/80 disabled:hover:bg-[#a8c7fa] dark:disabled:bg-[#3c5a8a] dark:disabled:text-white/70 dark:disabled:hover:bg-[#3c5a8a]"
          >
            {isStarting ? 'Starting...' : isRunning ? 'Running' : 'Run'}
          </button>
          {isRunning && (
            <button
              type="button"
              onClick={handleStop}
              disabled={isStopping}
              className="rounded-md bg-[#1a73e8] hover:bg-[#1765cc] px-5 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#a8c7fa] disabled:text-white/80 disabled:hover:bg-[#a8c7fa] dark:disabled:bg-[#3c5a8a] dark:disabled:text-white/70 dark:disabled:hover:bg-[#3c5a8a]"
            >
              {isStopping ? 'Stopping...' : 'Stop'}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-[#5f6368] dark:text-[#9aa0a6]">
          Loading videos...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {LANES.map((lane) => (
            <SimulationPartition
              key={lane}
              lane={lane}
              selectedVideo={videoByLane[lane]}
              lockedVideo={lockedVideos?.[lane]}
              state={displayTrafficState}
              streamUrl={streamStatus[lane].streamUrl}
              streamStartedAt={streamStatus[lane].startedAt}
              simulationRunning={isRunning}
              usedVideos={usedVideos}
              availableVideos={availableVideos}
              onVideoChange={handleVideoChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

