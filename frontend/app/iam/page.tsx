'use client'

import { CustomDurationModal } from '@/components/analytics/CustomDurationModal'
import LocationBar from '@/components/LocationBar'
import { useLocationFilter } from '@/context/LocationFilterContext'
import { useDurationFilter } from '@/hooks/useDurationFilter'
import { getIdentities, type Identity } from '@/lib/api'
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
  })
}

export default function IamPage() {
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

  const [isIdentities, setIsIdentities] = useState(true)
  const [identities, setIdentities] = useState<Identity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIdentities = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)
      const response = await getIdentities()
      setIdentities(response.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load identities')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isIdentities) fetchIdentities()
  }, [isIdentities, fetchIdentities])

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
          <p className="text-[#ffffff] font-mono text-xl ml-4">IAM</p>
        </div>

        <div
          className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all cursor-pointer"
          onClick={() => fetchIdentities(true)}
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

      <div className="flex pl-4 mt-2 gap-2">
        <button
          type="button"
          onClick={() => setIsIdentities(true)}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            isIdentities
              ? 'bg-[#292a2d] text-[#8AB4F8] border border-b-0 border-[#3c4043]'
              : 'text-[#9aa0a6] hover:text-[#e8eaed]'
          }`}
        >
          Identities
        </button>
        <button
          type="button"
          onClick={() => setIsIdentities(false)}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            !isIdentities
              ? 'bg-[#292a2d] text-[#8AB4F8] border border-b-0 border-[#3c4043]'
              : 'text-[#9aa0a6] hover:text-[#e8eaed]'
          }`}
        >
          Roles
        </button>
      </div>

      {isIdentities ? (
        <div className="gcloud-card mx-4 mb-4 overflow-hidden relative">
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
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">User ID</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Username</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Role</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Passkey</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Registered At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dadce0] dark:divide-[#3c4043]">
                {!loading && identities.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#9aa0a6]">
                      No identities found. Register a user at /signup.
                    </td>
                  </tr>
                )}
                {identities.map((identity, index) => (
                  <tr key={identity.id} className="hover:bg-[#202124]/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-[#9aa0a6]">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono text-[#8AB4F8]">{identity.id}</td>
                    <td className="px-4 py-3 text-sm text-[#e8eaed]">{identity.username}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#669DF6]/20 text-[#8AB4F8] capitalize">
                        {identity.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {identity.hasPasskey ? (
                        <span className="text-[#81c995]">Registered ({identity.passkeyCount})</span>
                      ) : (
                        <span className="text-[#9aa0a6]">Not set up</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9aa0a6]">{formatDateTime(identity.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="gcloud-card mx-4 mb-4 p-8 text-center text-[#9aa0a6]">
          Roles management coming soon.
        </div>
      )}
    </div>
  )
}
