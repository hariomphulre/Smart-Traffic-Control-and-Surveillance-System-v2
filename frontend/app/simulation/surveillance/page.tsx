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
  pauseSimulation,
  resumeSimulation,
  sleep,
  type SimulationPartitionStatus,
} from '@/lib/simulation'
import { IoIosPlay, IoMdRefresh } from 'react-icons/io'
import { IoPlayOutline, IoSearchSharp, IoStopOutline } from 'react-icons/io5'
import { FiPause, FiPlay } from 'react-icons/fi'
import { LuPause } from 'react-icons/lu'
import { GrPause, GrResume } from 'react-icons/gr'
import { RxResume } from 'react-icons/rx'
import LocationBar from '@/components/LocationBar'
import dynamic from 'next/dynamic'
import { useLocationFilter } from '@/context/LocationFilterContext'
import { MAP_SIGNALS } from '@/map/MapData';

const LANES: LaneId[] = [1, 2, 3, 4]

const DynamicMap = dynamic(() => import('@/components/RealMap'), { 
  ssr: false, 
  loading: () => <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono animate-pulse">Initializing Satellite Uplink...</div> 
});

export default function SimulationPage() {
  const { isMapOpen,isLocked, setIsMapOpen, pathSegments, handleMapPinClick } = useLocationFilter();

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
  const [sectionRefreshing, setSectionRefreshing] = useState(false)
  const [contentRefreshKey, setContentRefreshKey] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isPause, setIsPause] = useState(false)
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

  const applyStreamStatus = useCallback(
    (partitionStatus: Record<number, SimulationPartitionStatus>) => {
      const nextStatus = {
        1: partitionStatus[1] || { running: false },
        2: partitionStatus[2] || { running: false },
        3: partitionStatus[3] || { running: false },
        4: partitionStatus[4] || { running: false },
      } as Record<LaneId, SimulationPartitionStatus>
      setStreamStatus(nextStatus)
      return nextStatus
    },
    []
  )

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

      setWsUrl(response.wsUrl || null)
      setIsRunning(true)
      setTrafficLiveSnapshot(null)

      const batchStartedAt = response.batchStartedAt
      applyStreamStatus(
        Object.fromEntries(
          LANES.map((lane) => [
            lane,
            {
              running: Boolean(response.status?.[lane]?.running),
              streamUrl: response.status?.[lane]?.running
                ? `/streams/partition${lane}/index.m3u8`
                : undefined,
              startedAt: response.status?.[lane]?.startedAt ?? batchStartedAt,
              video: locked[lane],
              error: response.status?.[lane]?.error,
            },
          ])
        ) as Record<number, SimulationPartitionStatus>
      )

      const deadline = Date.now() + 120_000
      let ready = false

      while (Date.now() < deadline) {
        const latest = await getSimulationStatus()
        const nextStatus = applyStreamStatus(latest.status || {})
        const allRunning = LANES.every((lane) => nextStatus[lane]?.running)
        if (allRunning && !latest.starting) {
          ready = true
          break
        }
        await sleep(300)
      }

      if (!ready) {
        const finalStatus = await getSimulationStatus()
        const nextStatus = applyStreamStatus(finalStatus.status || {})
        const anyRunning = LANES.some((lane) => nextStatus[lane]?.running)
        if (!anyRunning) {
          const errors = LANES.map((lane) => nextStatus[lane]?.error).filter(Boolean)
          setError(
            errors.length > 0
              ? `Simulation pipelines failed: ${errors[0]}`
              : 'Simulation pipelines did not start. Check ml_service logs (docker compose logs ml-service).'
          )
          setLockedVideos(null)
          setIsRunning(false)
          return
        }
      }
    } catch {
      setError('Unable to start simulation pipelines')
      setIsRunning(false)
      setLockedVideos(null)
    } finally {
      setIsStarting(false)
    }
  }, [isRunning, videoByLane, applyStreamStatus])

  const handleStop = useCallback(async () => {
    setIsStopping(true)
    setError(null)
    try {
      await stopSimulation()
      setIsRunning(false)
      setIsPause(false)
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

  const handlePause = useCallback(async () => {
    if (!isRunning || isPause) return
    setError(null)
    try {
      const response = await pauseSimulation()
      const partitionStatus = response.status || {}
      setStreamStatus({
        1: partitionStatus[1] || { running: false },
        2: partitionStatus[2] || { running: false },
        3: partitionStatus[3] || { running: false },
        4: partitionStatus[4] || { running: false },
      })
      setIsPause(true)
    } catch {
      setError('Unable to pause simulation')
    }
  }, [isRunning, isPause])

  const handleResume = useCallback(async () => {
    if (!isRunning || !isPause) return
    setError(null)
    try {
      const response = await resumeSimulation()
      const partitionStatus = response.status || {}
      setStreamStatus({
        1: partitionStatus[1] || { running: false },
        2: partitionStatus[2] || { running: false },
        3: partitionStatus[3] || { running: false },
        4: partitionStatus[4] || { running: false },
      })
      setIsPause(false)
    } catch {
      setError('Unable to resume simulation')
    }
  }, [isRunning, isPause])

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

  const refreshPageData = useCallback(async () => {
    setSectionRefreshing(true)
    setError(null)

    try {
      const results = await Promise.allSettled([
        getSimulationVideos(),
        getDefaultVideoByLane(),
        getSimulationStatus(),
        getTrafficState(),
      ])

      if (results[0].status === 'fulfilled') {
        setAvailableVideos(results[0].value)
      }

      if (results[1].status === 'fulfilled' && !isRunning) {
        const defaults = results[1].value
        setVideoByLane({
          1: defaults[1],
          2: defaults[2],
          3: defaults[3],
          4: defaults[4],
        })
      }

      if (results[2].status === 'fulfilled') {
        const status = results[2].value
        setWsUrl(status.wsUrl || null)
        const nextStatus = applyStreamStatus(status.status || {})
        const hasRunning = LANES.some((lane) => nextStatus[lane]?.running)
        setIsRunning(hasRunning)

        if (hasRunning) {
          const locked = {} as Record<LaneId, string>
          for (const lane of LANES) {
            const video = nextStatus[lane]?.video
            if (typeof video === 'string' && video) locked[lane] = video
          }
          if (Object.keys(locked).length > 0) {
            setLockedVideos(locked)
            setVideoByLane((prev) => ({ ...prev, ...locked }))
          }
        } else {
          setLockedVideos(null)
        }
      }

      if (results[3].status === 'fulfilled') {
        setState(results[3].value)
      }

      if (results.every((result) => result.status === 'rejected')) {
        setError('Failed to refresh surveillance data')
      }

      setContentRefreshKey((key) => key + 1)
    } catch {
      setError('Failed to refresh surveillance data')
    } finally {
      setIsLoading(false)
      setSectionRefreshing(false)
    }
  }, [applyStreamStatus, isRunning])

  const handleRefresh = () => {
    refreshPageData()
  }

  return (
    <div className="max-w-full px-0 py-0">
      <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl relative z-[100]">
        <div className="flex items-center min-w-0 flex-1">
          <div>
            <p className="text-[#ffffff] font-mono text-xl ml-4">Live Surveillance</p>
          </div>
        </div>
        <div className="flex gap-1">
          <div className="shrink-0 self-start sm:self-center flex items-center gap-1">
            <div className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all"
              onClick={handleRun}
            >
              <IoPlayOutline className="h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA]"/>
              <button
                type="button"
                disabled={isStarting || isRunning || isStopping}
                className="text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg py-1 font-medium transition-all disabled:cursor-not-allowed"
              >
                {isStarting ? 'Starting...' : isRunning ? 'Running' : 'Run'}
              </button>
            </div>
            { isRunning && (
              <div className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all"
                onClick={isPause ? handleResume : handlePause}
              >
                {isPause ? <RxResume className="h-5 w-6 text-[#669DF6] group-hover:text-[#AECBFA]"/> : <GrPause className="h-4.5 w-5 text-[#669DF6] group-hover:text-[#AECBFA]"/> }
                <button
                  type="button"
                  disabled={isStopping || isStarting}
                  className="text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg py-1 font-medium transition-all disabled:cursor-not-allowed "
                >
                  {isPause ? 'Resume' : 'Pause'}
                </button>
              </div>
            )}
            { isRunning && (
              <div className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all"
                onClick={handleStop}
                >
                <IoStopOutline className="h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA]"/>
                <button
                  type="button"
                  disabled={isStopping}
                  className="text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg py-1 font-medium transition-all disabled:cursor-not-allowed "
                >
                  {isStopping ? 'Stopping...' : 'Stop'}
                </button>
              </div>
            )}
          </div>
          <div
            className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all"
            onClick={handleRefresh}
          >
            <IoMdRefresh
              className={`h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA] ${
                sectionRefreshing ? 'animate-spin' : ''
              }`}
            />
            <button
              type="button"
              disabled={sectionRefreshing}
              className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {isMapOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131314] w-[95vw] h-[94vh] border-2 border-[#3c4043] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
            
            <div className="h-12 border-b border-[#3c4043] bg-black flex items-center justify-between px-5 z-10 shrink-0">
              <h2 className="text-[#8AB4F8] font-mono text-lg flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                Global Signal Radar
              </h2>
              <button 
                onClick={() => setIsMapOpen(false)}
                className="text-[#9aa0a6] hover:text-white transition-colors font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 relative z-0">
              <DynamicMap 
                signals={MAP_SIGNALS} 
                pathSegments={pathSegments} 
                onPinClick={handleMapPinClick} 
              />
            </div>

          </div>
        </div>
      )}

      <div key={contentRefreshKey} className="relative min-h-[320px]">
        {sectionRefreshing && (
          <div className="absolute inset-0 z-[90] flex flex-col items-center justify-center bg-[#131314]/90 backdrop-blur-[1px]">
            <div className="w-10 h-10 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin mb-3" />
            <p className="text-[#9aa0a6] font-mono text-sm">Refreshing surveillance...</p>
          </div>
        )}

        <div className={sectionRefreshing ? 'pointer-events-none select-none' : undefined}>
          <LocationBar />

      {error && !sectionRefreshing && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-md border border-[#d93025]/40 bg-[#d93025]/10 text-[#f28b82] text-sm">
          {error}
        </div>
      )}

      {isLoading && !sectionRefreshing &&
        <div className="text-center py-8 text-[#5f6368] dark:text-[#9aa0a6]">
          Loading videos...
        </div>
      }  

      {!isLoading && 

        (isLocked ?
          (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
              {LANES.map((lane) => (
                <SimulationPartition
                  key={lane}
                  lane={lane}
                  selectedVideo={videoByLane[lane]}
                  lockedVideo={lockedVideos?.[lane]}
                  state={displayTrafficState}
                  streamUrl={streamStatus[lane].running ? streamStatus[lane].streamUrl : undefined}
                  streamStartedAt={streamStatus[lane].startedAt}
                  partitionError={streamStatus[lane].error}
                  partitionRunning={streamStatus[lane].running}
                  simulationRunning={isRunning}
                  usedVideos={usedVideos}
                  availableVideos={availableVideos}
                  onVideoChange={handleVideoChange}
                />
              ))}
            </div>
          )
          :
          (
            <div className="flex h-150 w-full items-center justify-center gap-1">
                <div className="text-gray-500 text-xl font-medium self-center justify-self">Invalid location path.</div>
                <div className="text-gray-500 text-xl font-medium">Please select a specific traffic signal location</div>
            </div>
          )
        )
      }

        </div>
      </div>
    </div>
  )
}

