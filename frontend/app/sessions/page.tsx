'use client'

import { CustomDurationModal } from '@/components/analytics/CustomDurationModal'
import LocationBar from '@/components/LocationBar'
import { useAuth } from '@/context/AuthContext'
import { useLocationFilter } from '@/context/LocationFilterContext'
import { useDurationFilter } from '@/hooks/useDurationFilter'
import { endSessions, getSessions, type UserSession } from '@/lib/api'
import { MAP_SIGNALS } from '@/map/MapData'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { FaCheckSquare, FaStop } from 'react-icons/fa'
import { FiCheck, FiCopy, FiSquare } from 'react-icons/fi'
import { IoMdRefresh } from 'react-icons/io'
import { IoStop } from 'react-icons/io5'
import { MdOutlineStopCircle } from 'react-icons/md'

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

function truncateKey(value: string, start = 14, end = 10) {
  if (value.length <= start + end + 3) return value
  return `${value.slice(0, start)}…${value.slice(-end)}`
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-[#9aa0a6] hover:text-[#8AB4F8] transition-colors shrink-0"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? <FiCheck className="h-3.5 w-3.5 text-[#81c995]" /> : <FiCopy className="h-3.5 w-3.5" />}
    </button>
  )
}

export default function SessionsPage() {
  const router = useRouter()
  const { session, isAdmin, logout } = useAuth()
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [endLoading, setEndLoading] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

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
    const interval = setInterval(() => fetchSessions(true), 10000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  const hasSelection = selectedIds.size > 0
  const allSelected =
    sessions.length > 0 && sessions.every((s) => selectedIds.has(s.sessionId))

  const toggleSelectAll = () => {
    if (!isAdmin) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        sessions.forEach((s) => next.delete(s.sessionId))
      } else {
        sessions.forEach((s) => next.add(s.sessionId))
      }
      return next
    })
  }

  const toggleSelectOne = (sessionId: string) => {
    if (!isAdmin) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  const handleEndSessions = async () => {
    if (!isAdmin || !session?.sessionId || selectedIds.size === 0) return
    setEndLoading(true)
    try {
      const ids = Array.from(selectedIds)
      await endSessions(ids, session.sessionId)
      const endedSelf = ids.includes(session.sessionId)
      setSelectedIds(new Set())
      setIsConfirmOpen(false)
      if (endedSelf) {
        await logout()
        router.replace('/login')
        return
      }
      await fetchSessions(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end sessions')
      setIsConfirmOpen(false)
    } finally {
      setEndLoading(false)
    }
  }

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
            className={`h-5 w-5 text-[#8AB4F8] group-hover:text-[#AECBFA] ${refreshing ? 'animate-spin' : ''}`}
          />
          <button
            type="button"
            disabled={refreshing}
            className="py-1 font-medium transition-all text-[#8AB4F8] group-hover:text-[#AECBFA] shadow-lg disabled:opacity-50"
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
                type="button"
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

      <div className="flex w-full px-4 h-14 items-center">
        <div className="flex items-center">
          <div
            className={`group flex items-center gap-1 px-3 justify-center rounded-sm transition-all ${
              isAdmin && hasSelection
                ? 'cursor-pointer hover:bg-[#202124]'
                : 'cursor-not-allowed opacity-60'
            }`}
            onClick={() => {
              if (isAdmin && hasSelection) setIsConfirmOpen(true)
            }}
            title={
              !isAdmin
                ? 'Only Admin can end sessions'
                : hasSelection
                  ? 'End selected sessions'
                  : 'Select sessions to end'
            }
          >
            <IoStop
              className={`h-4 w-4 ${
                isAdmin && hasSelection
                  ? 'text-[#8AB4F8] group-hover:text-[#AECBFA]'
                  : 'text-[#e8eaed61]'
              }`}
            />
            <button
              type="button"
              disabled={!isAdmin || !hasSelection || endLoading}
              className={`py-2 font-medium text-sm transition-all shadow-lg disabled:cursor-not-allowed ${
                isAdmin && hasSelection
                  ? 'text-[#8AB4F8] group-hover:text-[#AECBFA]'
                  : 'text-[#e8eaed61]'
              }`}
            >
              End Session
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#131314] mx-0 mb-4 overflow-hidden relative">
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
                <th className="px-4 py-2 text-left w-12">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={!isAdmin || sessions.length === 0}
                    className={`transition-colors ${
                      isAdmin
                        ? 'text-[#9aa0a6] hover:text-[#8AB4F8]'
                        : 'text-[#5f6368]/50 cursor-not-allowed'
                    }`}
                    aria-label={allSelected ? 'Deselect all sessions' : 'Select all sessions'}
                    title={isAdmin ? undefined : 'Only Admin can select sessions'}
                  >
                    {allSelected ? (
                      <FaCheckSquare className="h-4.5 w-4.5 text-[#8AB4F8]" />
                    ) : (
                      <FiSquare className="h-4.5 w-4.5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  S.No.
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  Session ID
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  Login Date & Time
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  User ID
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  Username
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  Public Passkey
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  Origin
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dadce0] dark:divide-[#3c4043]">
              {!loading && sessions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-[#9aa0a6]">
                    No active sessions.
                  </td>
                </tr>
              )}
              {sessions.map((row) => {
                const isSelected = selectedIds.has(row.sessionId)
                return (
                  <tr
                    key={row.sessionId}
                    className={`hover:bg-[#202124]/50 transition-colors ${
                      isSelected ? 'bg-[#8AB4F8]/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(row.sessionId)}
                        disabled={!isAdmin}
                        className={`transition-colors ${
                          isAdmin
                            ? 'text-[#9aa0a6] hover:text-[#8AB4F8]'
                            : 'text-[#5f6368]/50 cursor-not-allowed'
                        }`}
                        title={isAdmin ? undefined : 'Only Admin can select sessions'}
                        aria-label={isSelected ? 'Deselect session' : 'Select session'}
                      >
                        {isSelected ? (
                          <FaCheckSquare className="h-4.5 w-4.5 text-[#8AB4F8]" />
                        ) : (
                          <FiSquare className="h-4.5 w-4.5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9aa0a6]">{row.sno}</td>
                    <td className="px-4 py-3 text-sm font-mono text-[#e8eaed]">
                      <span className="inline-flex items-center gap-2">
                        <span className="truncate max-w-[180px]" title={row.sessionId}>
                          {row.sessionId}
                        </span>
                        <CopyButton value={row.sessionId} label="Session ID" />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9aa0a6]">
                      {formatDateTime(row.loginTime)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[#e8eaed]">
                      <span className="inline-flex items-center gap-2">
                        <span className="truncate max-w-[160px]" title={row.loginId}>
                          {row.loginId}
                        </span>
                        <CopyButton value={row.loginId} label="User ID" />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#e8eaed]">{row.username}</td>
                    <td className="px-4 py-3 text-sm">
                      {row.publicPasskey ? (
                        <span className="inline-flex items-center gap-2 font-mono text-[#81c995]">
                          <span className="truncate max-w-[220px]" title={row.publicPasskey}>
                            {truncateKey(row.publicPasskey)}
                          </span>
                          <CopyButton value={row.publicPasskey} label="public passkey" />
                        </span>
                      ) : (
                        <span className="text-[#9aa0a6]">
                          {row.username.toLowerCase() === 'guest' ? 'Guest' : 'Not set up'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9aa0a6]">
                      <span className="inline-flex items-center gap-2">
                        <span className="truncate max-w-[220px]" title={row.location}>
                          {row.location}
                        </span>
                        <CopyButton value={row.location} label="location path" />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9aa0a6]">{row.duration}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !endLoading && setIsConfirmOpen(false)}
        >
          <div
            className="bg-[#131314] border border-[#3c4043] rounded-lg shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#3c4043]">
              <h2 className="text-lg font-medium text-[#e8eaed]">End Session</h2>
              <p className="text-sm text-[#9aa0a6] mt-1">
                End {selectedIds.size} selected session{selectedIds.size === 1 ? '' : 's'}? This
                cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={endLoading}
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 text-sm text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043] rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={endLoading}
                onClick={handleEndSessions}
                className="px-4 py-2 text-sm bg-[#f28b82] hover:bg-[#f6aea9] text-[#202124] font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {endLoading ? 'Ending...' : 'End Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
