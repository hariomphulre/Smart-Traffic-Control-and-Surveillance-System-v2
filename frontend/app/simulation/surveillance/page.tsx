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

  return (
    <div className="max-w-full px-0 py-0">
      <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl">
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
          <div className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all"
          >
            {/* onClick={handleRefresh} */}
            <IoMdRefresh
              className={`h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA]
              `}
            />
            <button
              type="button"
              // disabled={sectionRefreshing}
              className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="w-full relative font-sans">
        {/* LOCATION BAR */}
        <LocationBar />

        {/* MAP MODAL */}
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
      </div>

      {isLoading && 
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
                  streamUrl={streamStatus[lane].streamUrl}
                  streamStartedAt={streamStatus[lane].startedAt}
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


      

      {/* {isLoading ? (
        <div className="text-center py-8 text-[#5f6368] dark:text-[#9aa0a6]">
          Loading videos...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
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
      )} */}
    </div>
  )
}

