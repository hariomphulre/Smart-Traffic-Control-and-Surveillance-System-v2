'use client'

import { CustomDurationModal } from '@/components/analytics/CustomDurationModal'
import IdentityLocationPicker from '@/components/iam/IdentityLocationPicker'
import RolesSection from '@/components/iam/RolesSection'
import LocationBar from '@/components/LocationBar'
import { useLocationFilter } from '@/context/LocationFilterContext'
import { useDurationFilter } from '@/hooks/useDurationFilter'
import {
  deleteIdentities,
  getIdentities,
  getRoles,
  registerIdentity,
  updateIdentity,
  type IamRole,
  type Identity,
} from '@/lib/api'
import {
  getLocationLevel,
  getViewLocationFilter,
  isAddLocationReady,
  resolveIdentityLocation,
} from '@/lib/iamLocation'
import { getDeviceBindingId } from '@/lib/deviceBinding'
import { MAP_SIGNALS } from '@/map/MapData'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import dynamic from 'next/dynamic'
import React, { useCallback, useEffect, useState } from 'react'
import {
  FiCheck,
  FiCheckSquare,
  FiCopy,
  FiEdit2,
  FiKey,
  FiMapPin,
  FiSearch,
  FiSquare,
  FiUserPlus,
  FiX,
} from 'react-icons/fi'
import { IoMdRefresh } from 'react-icons/io'
import { MdPersonAdd, MdPersonRemove } from 'react-icons/md'
import { RiFingerprintFill } from 'react-icons/ri'
import { FaCheckSquare } from 'react-icons/fa'

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

function truncateKey(value: string, start = 14, end = 10) {
  if (value.length <= start + end + 3) return value
  return `${value.slice(0, start)}…${value.slice(-end)}`
}

function identityRoles(identity: Identity): string[] {
  if (Array.isArray(identity.roles) && identity.roles.length > 0) return identity.roles
  return identity.role ? [identity.role] : []
}

function identityPathFromLocation(identity: Identity): string[] {
  if (
    !identity.locationPath ||
    identity.locationPath === 'India' ||
    identity.locationScope === 'national'
  ) {
    return []
  }
  return identity.locationPath.split('/').filter(Boolean)
}

function identityMatchesSearch(identity: Identity, sno: number, query: string) {
  if (!query) return true
  const q = query.toLowerCase()
  const passkeyText = identity.publicPasskey || (identity.hasPasskey ? 'registered' : 'not set up')
  const rolesText = identityRoles(identity).join(' ')
  return (
    String(sno).includes(q) ||
    identity.id.toLowerCase().includes(q) ||
    identity.username.toLowerCase().includes(q) ||
    rolesText.toLowerCase().includes(q) ||
    (identity.locationPath || '').toLowerCase().includes(q) ||
    (identity.locationLabel || '').toLowerCase().includes(q) ||
    passkeyText.toLowerCase().includes(q) ||
    formatDateTime(identity.createdAt).toLowerCase().includes(q)
  )
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

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [fingerprintMatchedIds, setFingerprintMatchedIds] = useState<string[] | null>(null)
  const [fingerprintLoading, setFingerprintLoading] = useState(false)
  const [fingerprintError, setFingerprintError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addStep, setAddStep] = useState<'details' | 'passkey' | 'done'>('details')
  const [addPath, setAddPath] = useState<string[]>([])
  const [addUseGlobal, setAddUseGlobal] = useState(false)
  const [addUsername, setAddUsername] = useState('')
  const [createdUserId, setCreatedUserId] = useState('')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editRoles, setEditRoles] = useState<string[]>(['User'])
  const [editPath, setEditPath] = useState<string[]>([])
  const [editUseGlobal, setEditUseGlobal] = useState(false)
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<IamRole[]>([])
  const [rolesRefreshToken, setRolesRefreshToken] = useState(0)

  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)

  const locationLevel = getLocationLevel(pathSegments)
  const pathKey = pathSegments.join('/')

  const fetchIdentities = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)
        setError(null)
        const filter = getViewLocationFilter(pathSegments)
        const response = await getIdentities(filter)
        setIdentities(response.data ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load identities')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [pathKey]
  )

  const fetchAvailableRoles = useCallback(async () => {
    try {
      const filter = getViewLocationFilter(pathSegments)
      const response = await getRoles(filter)
      setAvailableRoles(response.data ?? [])
    } catch {
      // keep previous list on soft failure
    }
  }, [pathKey])

  useEffect(() => {
    if (isIdentities) fetchIdentities()
  }, [isIdentities, fetchIdentities])

  useEffect(() => {
    fetchAvailableRoles()
  }, [fetchAvailableRoles, rolesRefreshToken])

  const handleRefresh = () => {
    if (isIdentities) fetchIdentities(true)
    else {
      setRolesRefreshToken((n) => n + 1)
      fetchAvailableRoles()
    }
  }

  useEffect(() => {
    // Clear fingerprint match when location changes
    setFingerprintMatchedIds(null)
    setFingerprintError(null)
  }, [pathKey])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const filteredIdentities = identities
    .map((identity, index) => ({ identity, sno: index + 1 }))
    .filter(({ identity, sno }) => {
      if (fingerprintMatchedIds && !fingerprintMatchedIds.includes(identity.id)) return false
      return identityMatchesSearch(identity, sno, debouncedSearch)
    })

  const allFilteredSelected =
    filteredIdentities.length > 0 &&
    filteredIdentities.every(({ identity }) => selectedIds.has(identity.id))

  const hasSelection = selectedIds.size > 0

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filteredIdentities.forEach(({ identity }) => next.delete(identity.id))
      } else {
        filteredIdentities.forEach(({ identity }) => next.add(identity.id))
      }
      return next
    })
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearFingerprintFilter = () => {
    setFingerprintMatchedIds(null)
    setFingerprintError(null)
  }

  const handleFingerprintFilter = async () => {
    setFingerprintError(null)
    setFingerprintLoading(true)
    try {
      const locationFilter = getViewLocationFilter(pathSegments)
      const deviceBindingId = getDeviceBindingId()

      const challengeRes = await fetch('/api/iam/fingerprint-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationFilter),
      })
      const challengeResult = await challengeRes.json()
      if (!challengeRes.ok) {
        setFingerprintError(challengeResult.error || 'Failed to start fingerprint check')
        return
      }

      const authResult = await startAuthentication({
        optionsJSON: challengeResult.options,
      })

      const verifyRes = await fetch('/api/iam/fingerprint-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challengeResult.challengeId,
          cred: authResult,
          deviceBindingId,
          ...locationFilter,
        }),
      })
      const verifyResult = await verifyRes.json()
      if (!verifyRes.ok) {
        setFingerprintError(verifyResult.error || 'Fingerprint did not match any identity')
        return
      }

      const matchedIds: string[] = Array.isArray(verifyResult.matchedUserIds)
        ? verifyResult.matchedUserIds
        : verifyResult.userId
          ? [verifyResult.userId]
          : []

      if (matchedIds.length === 0) {
        setFingerprintError('No identities matched this fingerprint')
        return
      }

      setFingerprintMatchedIds(matchedIds)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fingerprint check failed'
      if (/cancel|abort|not allowed/i.test(message)) {
        setFingerprintError(null)
      } else {
        setFingerprintError(message)
      }
    } finally {
      setFingerprintLoading(false)
    }
  }

  const openAddModal = () => {
    setAddPath([...pathSegments])
    setAddUseGlobal(false)
    setAddUsername('')
    setCreatedUserId('')
    setAddError('')
    setAddStep('details')
    setIsAddOpen(true)
  }

  const closeAddModal = async () => {
    if (addLoading) return
    // Fingerprint is mandatory — remove incomplete identity if closed mid-passkey
    if (addStep === 'passkey' && createdUserId) {
      try {
        await deleteIdentities([createdUserId])
      } catch {
        // ignore cleanup errors
      }
      await fetchIdentities(true)
    } else if (addStep === 'done') {
      await fetchIdentities(true)
    }
    setIsAddOpen(false)
    setAddError('')
    setCreatedUserId('')
    setAddStep('details')
  }

  const handleCreateIdentity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAddLocationReady(addPath, pathSegments, addUseGlobal)) {
      setAddError(
        addUseGlobal
          ? 'Global scope is not available at square level'
          : 'Select a deeper location path or enable Global scope'
      )
      return
    }
    const resolved = resolveIdentityLocation(addPath, pathSegments, addUseGlobal)
    if (resolved.error || !resolved.location) {
      setAddError(resolved.error || 'Invalid location')
      return
    }
    setAddError('')
    setAddLoading(true)
    try {
      const result = await registerIdentity(addUsername.trim(), resolved.location)
      setCreatedUserId(result.id)
      setAddStep('passkey')
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setAddLoading(false)
    }
  }

  const handleRegisterPasskey = async () => {
    if (!createdUserId) return
    setAddError('')
    setAddLoading(true)
    try {
      const response = await fetch('/api/auth/register-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: createdUserId }),
      })
      const challengeResult = await response.json()
      if (!response.ok) {
        setAddError(challengeResult.error || 'Failed to start passkey registration')
        return
      }

      const authResult = await startRegistration({
        optionsJSON: challengeResult.options,
      })

      const verifyRes = await fetch('/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: createdUserId,
          cred: authResult,
          deviceBindingId: getDeviceBindingId(),
        }),
      })
      const verifyResult = await verifyRes.json()
      if (!verifyRes.ok) {
        setAddError(verifyResult.error || 'Passkey verification failed')
        return
      }

      setAddStep('done')
      await fetchIdentities(true)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Passkey registration failed')
    } finally {
      setAddLoading(false)
    }
  }

  const openEditModal = (identity: Identity) => {
    setEditingIdentity(identity)
    setEditUsername(identity.username)
    const currentRoles = identityRoles(identity)
    const matchedTitles = currentRoles.map((title) => {
      const matched = availableRoles.find((r) => r.title.toLowerCase() === title.toLowerCase())
      return matched?.title ?? title
    })
    setEditRoles(matchedTitles.length > 0 ? matchedTitles : ['User'])
    const rolePath = identityPathFromLocation(identity)
    const isGlobalForBase =
      (pathSegments.length === 0 && identity.locationScope === 'national') ||
      (pathSegments.length === 1 && identity.locationScope === 'state') ||
      (pathSegments.length >= 2 &&
        pathSegments.length <= 3 &&
        identity.locationScope === 'city')
    setEditPath(rolePath.length > 0 ? rolePath : [...pathSegments])
    setEditUseGlobal(isGlobalForBase)
    setEditError('')
    fetchAvailableRoles()
  }

  const closeEditModal = () => {
    if (editLoading) return
    setEditingIdentity(null)
    setEditError('')
  }

  const toggleEditRole = (title: string) => {
    setEditRoles((prev) =>
      prev.includes(title) ? prev.filter((r) => r !== title) : [...prev, title]
    )
  }

  const handleEditIdentity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingIdentity) return
    if (editRoles.length === 0) {
      setEditError('Select at least one role')
      return
    }
    if (!isAddLocationReady(editPath, pathSegments, editUseGlobal)) {
      setEditError(
        pathSegments.length >= 4
          ? 'Location is fixed to the current square'
          : 'Select a deeper location path or enable Global scope'
      )
      return
    }
    const resolved = resolveIdentityLocation(editPath, pathSegments, editUseGlobal)
    if (resolved.error || !resolved.location) {
      setEditError(resolved.error || 'Invalid location')
      return
    }

    setEditError('')
    setEditLoading(true)
    try {
      await updateIdentity({
        id: editingIdentity.id,
        username: editUsername.trim(),
        roles: editRoles,
        location: resolved.location,
      })
      setEditingIdentity(null)
      await fetchIdentities(true)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setEditLoading(false)
    }
  }

  const handleConfirmRemove = async () => {
    if (!hasSelection) return
    setRemoveLoading(true)
    try {
      await deleteIdentities(Array.from(selectedIds))
      setSelectedIds(new Set())
      setIsConfirmRemoveOpen(false)
      await fetchIdentities(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove identities')
      setIsConfirmRemoveOpen(false)
    } finally {
      setRemoveLoading(false)
    }
  }

  const locationHint =
    locationLevel === 'national'
      ? 'India (national) — choose a state or entire country'
      : locationLevel === 'state'
        ? `${pathSegments[0]} — choose a city or entire state`
        : locationLevel === 'city'
          ? `${pathSegments[1]} — choose a square or entire city`
          : `${pathSegments[3]} — square fixed`

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
          onClick={handleRefresh}
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

      <div className="flex border-b border-[#3c4043] pl-4 mt-2 gap-2">
        <button
          type="button"
          onClick={() => setIsIdentities(true)}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            isIdentities
              ? 'text-[#8AB4F8] border-b-2 border-[#8AB4F8]'
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
              ? 'text-[#8AB4F8] border-b-2 border-[#8AB4F8]'
              : 'text-[#9aa0a6] hover:text-[#e8eaed]'
          }`}
        >
          Roles
        </button>
      </div>

      {isIdentities && (
      <div className="flex w-full px-4 h-14 items-center">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex">
              <div
                className="group flex items-center gap-1 px-3 justify-center rounded-sm transition-all cursor-pointer hover:bg-[#202124]"
                onClick={openAddModal}
              >
                <MdPersonAdd className="h-5 w-5 text-[#8AB4F8] group-hover:text-[#AECBFA]" />
                <button
                  type="button"
                  className="py-2 font-medium text-sm transition-all text-[#8AB4F8] group-hover:text-[#AECBFA] shadow-lg"
                >
                  Add Identity
                </button>
              </div>
              <div
                className={`group flex items-center gap-1 px-3 justify-center rounded-sm transition-all ${
                  hasSelection
                    ? 'cursor-pointer hover:bg-[#202124]'
                    : 'cursor-not-allowed opacity-60'
                }`}
                onClick={() => {
                  if (hasSelection) setIsConfirmRemoveOpen(true)
                }}
              >
                <MdPersonRemove
                  className={`h-5 w-5 ${
                    hasSelection
                      ? 'text-[#8AB4F8] group-hover:text-[#AECBFA]'
                      : 'text-[#e8eaed61]'
                  }`}
                />
                <button
                  type="button"
                  disabled={!hasSelection}
                  className={`py-2 font-medium text-sm transition-all shadow-lg disabled:cursor-not-allowed ${
                    hasSelection
                      ? 'text-[#8AB4F8] group-hover:text-[#AECBFA]'
                      : 'text-[#e8eaed61]'
                  }`}
                >
                  Remove Identity
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {fingerprintMatchedIds && (
                <button
                  type="button"
                  onClick={clearFingerprintFilter}
                  disabled={fingerprintLoading}
                  className="px-3 py-2 text-sm font-medium transition-colors rounded flex border border-[#3c4043] items-center gap-1 whitespace-nowrap text-[#9aa0a6] hover:border-[#8AB4F8] hover:text-[#8AB4F8] disabled:opacity-50"
                  title="Clear fingerprint filter"
                >
                  <FiX className="h-4 w-4" />
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleFingerprintFilter}
                disabled={fingerprintLoading}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded flex border border-[#8AB4F8] items-center gap-2 whitespace-nowrap disabled:opacity-50 ${
                  fingerprintMatchedIds
                    ? 'text-[#8AB4F8]'
                    : 'text-[#8AB4F8] hover:border-[#AECBFA] hover:text-[#AECBFA]'
                }`}
                title="Scan fingerprint to find matching identities"
              >
                <RiFingerprintFill className={`h-4.5 w-4.5 ${fingerprintLoading ? 'animate-pulse' : ''}`} />
                {fingerprintLoading
                  ? 'Scanning...'
                  : fingerprintMatchedIds
                    ? `Matched (${fingerprintMatchedIds.length})`
                    : 'Fingerprint Scan'}
              </button>
              <div className="relative w-full md:w-100 border border-[#3C4043] rounded-md transition-colors focus-within:border-[#8AB4F8] focus-within:ring-0.7 focus-within:ring-[#8AB4F8]">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
                <input
                  type="text"
                  placeholder="S.No., User ID, Username, Role, Location, Passkey..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 outline-none text-sm bg-transparent text-[#e8eaed]"
                />
              </div>
            </div>
          </div>
      </div>
      )}

      {isIdentities ? (
        <div className="bg-[#131314] mx-0 mb-4 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#131314]/75 backdrop-blur-[1px]">
              <div className="w-8 h-8 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <div className="px-4 py-3 text-sm text-[#f28b82] border-b border-[#3c4043]">{error}</div>
          )}
          {fingerprintError && (
            <div className="px-4 py-3 text-sm text-[#f28b82] border-b border-[#3c4043] flex items-center justify-between gap-3">
              <span>{fingerprintError}</span>
              <button
                type="button"
                onClick={() => setFingerprintError(null)}
                className="text-[#9aa0a6] hover:text-[#e8eaed] transition-colors"
                aria-label="Dismiss"
              >
                <FiX size={16} />
              </button>
            </div>
          )}
          {fingerprintMatchedIds && !fingerprintError && (
            <div className="px-4 py-2 text-sm text-[#8AB4F8] border-b border-[#3c4043] flex items-center justify-between gap-3 bg-[#8AB4F8]/5">
              <span>
                Showing {fingerprintMatchedIds.length} identit
                {fingerprintMatchedIds.length === 1 ? 'y' : 'ies'} matched by fingerprint
              </span>
              <button
                type="button"
                onClick={clearFingerprintFilter}
                className="text-[#9aa0a6] hover:text-[#e8eaed] text-xs transition-colors"
              >
                Clear filter
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full gcloud-table">
              <thead className="bg-[#f8f9fa] dark:bg-[#292A2D] border-b border-[#dadce0] dark:border-[#5f6368]">
                <tr>
                  <th className="px-4 pt-1 text-left w-12">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-[#9aa0a6] hover:text-[#8AB4F8] transition-colors"
                      aria-label={allFilteredSelected ? 'Deselect all' : 'Select all'}
                      title={allFilteredSelected ? 'Deselect all' : 'Select all'}
                    >
                      {allFilteredSelected ? (
                        <FaCheckSquare className="h-4.5 w-4.5 text-[#8AB4F8]" />
                      ) : (
                        <FiSquare className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">S.No.</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">User ID</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Username</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Roles</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Origin</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Public Passkey</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Create Date & Time</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dadce0] dark:divide-[#3c4043]">
                {!loading && filteredIdentities.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-[#9aa0a6]">
                      {debouncedSearch ? 'No identities match your search.' : 'No identities found for this location.'}
                    </td>
                  </tr>
                )}
                {filteredIdentities.map(({ identity, sno }) => {
                  const isSelected = selectedIds.has(identity.id)
                  return (
                    <tr
                      key={identity.id}
                      className={`hover:bg-[#202124]/50 transition-colors ${
                        isSelected ? 'bg-[#8AB4F8]/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(identity.id)}
                          className="text-[#9aa0a6] hover:text-[#8AB4F8] transition-colors"
                          aria-label={isSelected ? 'Deselect row' : 'Select row'}
                        >
                          {isSelected ? (
                            <FaCheckSquare className="h-4.5 w-4.5 text-[#8AB4F8]" />
                          ) : (
                            <FiSquare className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#9aa0a6]">{sno}</td>
                      <td className="px-4 py-3 text-sm font-mono text-[#e8eaed]">
                        <span className="inline-flex items-center gap-2">
                          <span className="truncate max-w-[180px]" title={identity.id}>
                            {identity.id}
                          </span>
                          <CopyButton value={identity.id} label="User ID" />
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#e8eaed]">{identity.username}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1 items-start">
                          {identityRoles(identity).map((roleTitle) => (
                            <span
                              key={roleTitle}
                              className="px-2 py-0.5 rounded text-sm font-mono text-[#8AB4F8] capitalize"
                            >
                              {roleTitle}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#9aa0a6]">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="truncate max-w-[220px]"
                            title={identity.locationPath || identity.locationLabel || 'India'}
                          >
                            {identity.locationPath || identity.locationLabel || 'India'}
                          </span>
                          <CopyButton
                            value={identity.locationPath || identity.locationLabel || 'India'}
                            label="location path"
                          />
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {identity.publicPasskey ? (
                          <span className="inline-flex items-center gap-2 font-mono text-[#81c995]">
                            <span className="truncate max-w-[220px]" title={identity.publicPasskey}>
                              {truncateKey(identity.publicPasskey)}
                            </span>
                            <CopyButton value={identity.publicPasskey} label="public passkey" />
                          </span>
                        ) : (
                          <span className="text-[#9aa0a6]">Not set up</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#9aa0a6]">{formatDateTime(identity.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(identity)}
                          className="text-[#8AB4F8] hover:text-[#AECBFA] transition-colors"
                          aria-label={`Edit ${identity.username}`}
                          title="Edit identity"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <RolesSection refreshToken={rolesRefreshToken} pathSegments={pathSegments} />
      )}

      {/* Add Identity modal — signup flow: location + username → fingerprint */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeAddModal}
        >
          <div
            className="bg-[#131314] border border-[#3c4043] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c4043] bg-gradient-to-r from-[#8AB4F8]/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8AB4F8]/20 flex items-center justify-center">
                  {addStep === 'passkey' || addStep === 'done' ? (
                    <FiKey className="w-5 h-5 text-[#8AB4F8]" />
                  ) : (
                    <FiUserPlus className="w-5 h-5 text-[#8AB4F8]" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-medium text-[#e8eaed]">
                    {addStep === 'details'
                      ? 'Add Identity'
                      : addStep === 'passkey'
                        ? 'Register Fingerprint'
                        : 'Identity Ready'}
                  </h2>
                  <p className="text-xs text-[#9aa0a6] mt-0.5">{locationHint}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                className="text-[#9aa0a6] hover:text-[#e8eaed] transition-colors p-1.5 rounded-md hover:bg-[#3c4043]"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-2 px-6 pt-4">
              {(['details', 'passkey'] as const).map((step, idx) => {
                const active =
                  addStep === step ||
                  (addStep === 'done' && step === 'passkey') ||
                  (addStep === 'passkey' && step === 'details') ||
                  addStep === 'done'
                const current = addStep === step
                return (
                  <React.Fragment key={step}>
                    {idx > 0 && <div className={`flex-1 h-px ${active ? 'bg-[#8AB4F8]/50' : 'bg-[#3c4043]'}`} />}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border ${
                        current
                          ? 'bg-[#8AB4F8] text-[#202124] border-[#8AB4F8]'
                          : active
                            ? 'border-[#8AB4F8] text-[#8AB4F8]'
                            : 'border-[#3c4043] text-[#9aa0a6]'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  </React.Fragment>
                )
              })}
            </div>

            {addStep === 'details' && (
              <form onSubmit={handleCreateIdentity} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                    Assign location
                  </label>
                  <IdentityLocationPicker
                    lockedBase={pathSegments}
                    path={addPath}
                    onPathChange={setAddPath}
                    useGlobal={addUseGlobal}
                    onUseGlobalChange={setAddUseGlobal}
                  />
                  <p className="text-[11px] text-[#5f6368] mt-2">
                    Locked to current IAM path — you can only go deeper within it, or use Global scope.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="add-username"
                    className="block text-sm font-medium text-[#e8eaed] mb-2"
                  >
                    Username
                  </label>
                  <input
                    id="add-username"
                    type="text"
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full px-4 py-3 rounded-lg border border-[#3c4043] bg-[#202124] text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#8AB4F8]"
                    autoComplete="username"
                    required
                  />
                </div>

                {addError && <p className="text-sm text-[#f28b82]">{addError}</p>}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => closeAddModal()}
                    disabled={addLoading}
                    className="px-4 py-2 text-sm text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043] rounded-md transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      addLoading ||
                      !addUsername.trim() ||
                      !isAddLocationReady(addPath, pathSegments, addUseGlobal)
                    }
                    className="px-4 py-2 text-sm bg-[#8AB4F8] hover:bg-[#aecbfa] text-[#202124] font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    {addLoading ? 'Creating...' : 'Continue'}
                  </button>
                </div>
              </form>
            )}

            {addStep === 'passkey' && (
              <div className="p-6 space-y-5">
                <div className="rounded-lg border border-[#3c4043] bg-[#0f0f10] p-4 text-center">
                  <p className="text-sm text-[#e8eaed]">
                    Identity <span className="font-medium text-[#8AB4F8]">{addUsername}</span> created
                  </p>
                  <p className="text-xs font-mono text-[#9aa0a6] mt-1">{createdUserId}</p>
                  <p className="text-xs text-[#5f6368] mt-2 flex items-center justify-center gap-1">
                    <FiMapPin className="h-3 w-3" />
                    {addUseGlobal
                      ? `Global · ${pathSegments.join(' / ') || 'India'}`
                      : addPath.join(' / ') || 'India'}
                  </p>
                </div>

                <p className="text-sm text-[#9aa0a6] text-center">
                  Fingerprint / passkey registration is required to finish creating this identity.
                </p>

                {addError && <p className="text-sm text-[#f28b82] text-center">{addError}</p>}

                <button
                  type="button"
                  onClick={handleRegisterPasskey}
                  disabled={addLoading}
                  className="w-full py-3 px-4 rounded-lg bg-[#8AB4F8] hover:bg-[#aecbfa] text-[#202124] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiKey className="w-4 h-4" />
                  {addLoading ? 'Waiting for device...' : 'Register Fingerprint'}
                </button>

                <p className="text-[11px] text-center text-[#5f6368]">
                  Closing now will discard this identity until a passkey is registered.
                </p>
              </div>
            )}

            {addStep === 'done' && (
              <div className="p-6 space-y-5 text-center">
                <p className="text-[#81c995] font-medium">Passkey registered successfully</p>
                <p className="text-sm text-[#9aa0a6]">
                  <span className="text-[#e8eaed]">{addUsername}</span> is ready to sign in.
                </p>
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="w-full py-3 px-4 rounded-lg bg-[#8AB4F8] hover:bg-[#aecbfa] text-[#202124] font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {editingIdentity && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeEditModal}
        >
          <div
            className="bg-[#131314] border border-[#3c4043] rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c4043]">
              <div>
                <h2 className="text-lg font-medium text-[#e8eaed]">Edit Identity</h2>
                <p className="text-xs text-[#9aa0a6] font-mono mt-0.5">{editingIdentity.id}</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="text-[#9aa0a6] hover:text-[#e8eaed] transition-colors p-1.5 rounded-md hover:bg-[#3c4043]"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleEditIdentity} className="p-6 space-y-5">
              <div>
                <label
                  htmlFor="edit-username"
                  className="block text-sm font-medium text-[#e8eaed] mb-2"
                >
                  Username
                </label>
                <input
                  id="edit-username"
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[#3c4043] bg-[#202124] text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#8AB4F8]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e8eaed] mb-2">Roles</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-lg border border-[#3c4043] p-2 bg-[#0f0f10]">
                  {availableRoles.length === 0 ? (
                    <p className="px-2 py-2 text-sm text-[#9aa0a6]">No roles available</p>
                  ) : (
                    availableRoles.map((role) => {
                      const checked = editRoles.includes(role.title)
                      return (
                        <label
                          key={role.id}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-colors ${
                            checked ? 'bg-[#8AB4F8]/10' : 'hover:bg-[#202124]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEditRole(role.title)}
                            className="rounded border-[#5f6368] bg-[#131314] text-[#8AB4F8] focus:ring-[#8AB4F8]"
                          />
                          <span className="text-sm text-[#e8eaed]">
                            {role.title}
                            {role.roleType === 'predefined' ? (
                              <span className="text-[#9aa0a6]"> (Predefined)</span>
                            ) : null}
                          </span>
                        </label>
                      )
                    })
                  )}
                </div>
                <p className="text-xs text-[#5f6368] mt-1.5">
                  Assign one or more roles from the Roles tab.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e8eaed] mb-2">Origin</label>
                <IdentityLocationPicker
                  lockedBase={pathSegments}
                  path={editPath}
                  onPathChange={setEditPath}
                  useGlobal={editUseGlobal}
                  onUseGlobalChange={setEditUseGlobal}
                />
              </div>

              {editError && <p className="text-sm text-[#f28b82]">{editError}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editLoading}
                  className="px-4 py-2 text-sm text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043] rounded-md transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    editLoading ||
                    !editUsername.trim() ||
                    editRoles.length === 0 ||
                    !isAddLocationReady(editPath, pathSegments, editUseGlobal)
                  }
                  className="px-4 py-2 text-sm bg-[#8AB4F8] hover:bg-[#aecbfa] text-[#202124] font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmRemoveOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !removeLoading && setIsConfirmRemoveOpen(false)}
        >
          <div
            className="bg-[#131314] border border-[#3c4043] rounded-lg shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-medium text-[#e8eaed] mb-2">Remove Identity</h2>
            <p className="text-sm text-[#9aa0a6] mb-6">
              Remove {selectedIds.size} selected {selectedIds.size === 1 ? 'identity' : 'identities'}?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={removeLoading}
                onClick={() => setIsConfirmRemoveOpen(false)}
                className="px-4 py-2 text-sm text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043] rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removeLoading}
                onClick={handleConfirmRemove}
                className="px-4 py-2 text-sm bg-[#f28b82] hover:bg-[#ee675c] text-[#202124] font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {removeLoading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
