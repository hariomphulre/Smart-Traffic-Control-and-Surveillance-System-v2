'use client'

import { useCallback, useEffect, useState } from 'react'
import SimulationPartition from '@/components/SimulationPartition'
import type { LaneId } from '@/components/SignalLanePanel'
import { getTrafficState, type TrafficState } from '@/lib/api'
import { getDefaultVideoByLane, getSimulationVideos, type SimulationVideo } from '@/lib/simulation-videos'

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
    const id = setInterval(fetchState, 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const handleVideoChange = useCallback((lane: LaneId, file: string) => {
    setVideoByLane((prev) => ({ ...prev, [lane]: file }))
  }, [])

  const usedVideos = LANES.map((lane) => videoByLane[lane])

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
        <button
          type="button"
          className="shrink-0 self-start sm:self-center rounded-md bg-[#1a73e8] hover:bg-[#1765cc] px-5 py-2 text-sm font-medium text-white transition-colors"
        >
          Run
        </button>
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
              state={state}
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

