'use client'

import { CustomDurationModal } from '@/components/analytics/CustomDurationModal'
import LocationBar from '@/components/LocationBar'
import { useLocationFilter } from '@/context/LocationFilterContext'
import { useDurationFilter } from '@/hooks/useDurationFilter'
import { getSessions, type UserSession } from '@/lib/api'
import { MAP_SIGNALS } from '@/map/MapData'
import dynamic from 'next/dynamic'
import React, { useCallback, useEffect, useState } from 'react'
import { IoMdRefresh } from 'react-icons/io'

const DynamicMap = dynamic(() => import('@/components/RealMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono animate-pulse">
      Initializing Satellite Uplink...
    </div>
  ),
})

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { isMapOpen, setIsMapOpen, pathSegments, handleMapPinClick } = useLocationFilter()
  const {
    isCustomModalOpen,
    customStart,
    customEnd,
    setCustomStart,
    setCustomEnd,
    handleCustomApply,
    closeCustomModal,
  } = useDurationFilter('all time')

  const fetchSessions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)
      const response = await getSessions()
      setSessions(response.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(() => fetchSessions(true), 30000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  return (
    <div className="max-w-full dark:bg-[#131314]">
      <CustomDurationModal
        isOpen={isCustomModalOpen}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        onClose={closeCustomModal}
        onApply={handleCustomApply}
      />

      <div className="w-full flex items-center justify-between h-13 mb-0 border-b border-[#3c4043] bg-[#131314] p-1 shadow-xl relative z-[60]">
        <div className="flex items-center min-w-170 flex-1">
          <p className="text-[#ffffff] font-mono text-xl ml-4">Sessions</p>
        </div>

        <div
          className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all cursor-pointer"
          onClick={() => fetchSessions(true)}
        >
          <IoMdRefresh
            className={`h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA] ${refreshing ? 'animate-spin' : ''}`}
          />
          <button
            type="button"
            disabled={refreshing}
            className="py-1 font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {isMapOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131314] w-[95vw] h-[94vh] border-2 border-[#3c4043] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
            <div className="h-12 border-b border-[#3c4043] bg-black flex items-center justify-between px-5 z-10 shrink-0">
              <h2 className="text-[#8AB4F8] font-mono text-lg flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
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

      <div className="w-full relative font-sans z-[55]">
        <LocationBar />
      </div>

      <div className="gcloud-card mx-4 mt-2 mb-4 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#131314]/75 backdrop-blur-[1px]">
            <div className="w-8 h-8 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="px-4 py-3 text-sm text-[#f28b82] border-b border-[#3c4043]">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full gcloud-table">
            <thead className="bg-[#f8f9fa] dark:bg-[#292A2D] border-b border-[#dadce0] dark:border-[#5f6368]">
              <tr>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">S.No.</th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Session ID</th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Login Time</th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Login ID</th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Passkey</th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">State/City</th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dadce0] dark:divide-[#3c4043]">
              {!loading && sessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#9aa0a6]">
                    No active sessions. Sign in at /login to create a session.
                  </td>
                </tr>
              )}
              {sessions.map((session) => (
                <tr key={session.sessionId} className="hover:bg-[#202124]/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-[#9aa0a6]">{session.sno}</td>
                  <td className="px-4 py-3 text-sm font-mono text-[#8AB4F8]">{session.sessionId.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-[#9aa0a6]">{formatDateTime(session.loginTime)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-[#e8eaed]">{session.loginId}</td>
                  <td className="px-4 py-3 text-sm text-[#e8eaed]">{session.passkey}</td>
                  <td className="px-4 py-3 text-sm text-[#9aa0a6]">{session.location}</td>
                  <td className="px-4 py-3 text-sm text-[#81c995]">{session.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
