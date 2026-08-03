'use client'

import { CustomDurationModal } from '@/components/analytics/CustomDurationModal'
import LocationBar from '@/components/LocationBar'
import { useLocationFilter } from '@/context/LocationFilterContext'
import { useDurationFilter } from '@/hooks/useDurationFilter'
import {
  deleteIdentities,
  getIdentities,
  registerIdentity,
  updateIdentity,
  type Identity,
} from '@/lib/api'
import { MAP_SIGNALS } from '@/map/MapData'
import dynamic from 'next/dynamic'
import React, { useCallback, useEffect, useState } from 'react'
import { FiCheckSquare, FiEdit2, FiMinus, FiPlus, FiSearch, FiSquare, FiUserPlus, FiX } from 'react-icons/fi'
import { IoMdRefresh } from 'react-icons/io'
import { MdPersonAdd, MdPersonRemove } from 'react-icons/md'

const DynamicMap = dynamic(() => import('@/components/RealMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono animate-pulse">
      Initializing Satellite Uplink...
    </div>
  ),
})

const ROLE_OPTIONS = ['user', 'admin', 'operator'] as const

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function identityMatchesSearch(identity: Identity, query: string) {
  if (!query) return true
  const q = query.toLowerCase()
  const passkeyLabel = identity.hasPasskey
    ? `registered (${identity.passkeyCount})`
    : 'not set up'
  return (
    identity.id.toLowerCase().includes(q) ||
    identity.username.toLowerCase().includes(q) ||
    identity.role.toLowerCase().includes(q) ||
    passkeyLabel.includes(q) ||
    formatDateTime(identity.createdAt).toLowerCase().includes(q)
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addUsername, setAddUsername] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState<string>('user')
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const filteredIdentities = identities.filter((identity) =>
    identityMatchesSearch(identity, debouncedSearch)
  )

  const allFilteredSelected =
    filteredIdentities.length > 0 &&
    filteredIdentities.every((identity) => selectedIds.has(identity.id))

  const hasSelection = selectedIds.size > 0

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filteredIdentities.forEach((identity) => next.delete(identity.id))
      } else {
        filteredIdentities.forEach((identity) => next.add(identity.id))
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

  const openAddModal = () => {
    setAddUsername('')
    setAddPassword('')
    setAddError('')
    setIsAddOpen(true)
  }

  const closeAddModal = () => {
    if (addLoading) return
    setIsAddOpen(false)
    setAddError('')
  }

  const handleAddIdentity = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)
    try {
      await registerIdentity(addUsername.trim(), addPassword)
      setIsAddOpen(false)
      setAddUsername('')
      setAddPassword('')
      await fetchIdentities(true)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setAddLoading(false)
    }
  }

  const openEditModal = (identity: Identity) => {
    setEditingIdentity(identity)
    setEditUsername(identity.username)
    setEditPassword('')
    setEditRole(identity.role)
    setEditError('')
  }

  const closeEditModal = () => {
    if (editLoading) return
    setEditingIdentity(null)
    setEditError('')
  }

  const handleEditIdentity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingIdentity) return
    setEditError('')
    setEditLoading(true)
    try {
      await updateIdentity({
        id: editingIdentity.id,
        username: editUsername.trim(),
        role: editRole,
        ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
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

      <div className="flex w-full px-4 h-14 items-center">
        {isIdentities ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex">
              <div
                className="group flex items-center gap-1 px-3 justify-center rounded-sm transition-all cursor-pointer hover:bg-[#202124]"
                onClick={openAddModal}
              >
                <MdPersonAdd className="h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA]" />
                <button
                  type="button"
                  className="py-1 font-medium text-sm transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg"
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
                      ? 'text-[#669DF6] group-hover:text-[#AECBFA]'
                      : 'text-[#e8eaed61]'
                  }`}
                />
                <button
                  type="button"
                  disabled={!hasSelection}
                  className={`py-1 font-medium text-sm transition-all shadow-lg disabled:cursor-not-allowed ${
                    hasSelection
                      ? 'text-[#669DF6] group-hover:text-[#AECBFA]'
                      : 'text-[#e8eaed61]'
                  }`}
                >
                  Remove Identity
                </button>
              </div>
            </div>
            <div className="relative w-full md:w-100 border border-[#3C4043] rounded-md transition-colors focus-within:border-[#8AB4F8] focus-within:ring-0.7 focus-within:ring-[#8AB4F8]">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
              <input
                type="text"
                placeholder="User ID, Username, Role, Passkey, Create Date..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 outline-none text-sm bg-transparent text-[#e8eaed]"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="group flex items-center gap-1 px-3 justify-center rounded-sm transition-all cursor-pointer hover:bg-[#202124]">
              <FiPlus className="h-4 w-4 text-[#669DF6] group-hover:text-[#AECBFA]" />
              <button
                type="button"
                className="py-1 font-medium text-sm transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg"
              >
                Create Role
              </button>
            </div>
            <div className="group flex items-center gap-1 px-3 justify-center rounded-sm transition-all cursor-pointer hover:bg-[#202124]">
              <FiMinus className="h-4 w-4 text-[#e8eaed61] group-hover:text-[#AECBFA]" />
              <button
                type="button"
                className="py-1 font-medium text-sm transition-all text-[#e8eaed61] group-hover:text-[#AECBFA] shadow-lg"
              >
                Remove Role
              </button>
            </div>
          </div>
        )}
      </div>

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
          <div className="overflow-x-auto">
            <table className="w-full gcloud-table">
              <thead className="bg-[#f8f9fa] dark:bg-[#292A2D] border-b border-[#dadce0] dark:border-[#5f6368]">
                <tr>
                  <th className="px-4 py-2 text-left w-12">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-[#9aa0a6] hover:text-[#8AB4F8] transition-colors"
                      aria-label={allFilteredSelected ? 'Deselect all' : 'Select all'}
                      title={allFilteredSelected ? 'Deselect all' : 'Select all'}
                    >
                      {allFilteredSelected ? (
                        <FiCheckSquare className="h-4.5 w-4.5 text-[#8AB4F8]" />
                      ) : (
                        <FiSquare className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">S.No.</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">User ID</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Username</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Roles</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Public Passkey</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Create Date & Time</th>
                  <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dadce0] dark:divide-[#3c4043]">
                {!loading && filteredIdentities.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#9aa0a6]">
                      {debouncedSearch ? 'No identities match your search.' : 'No identities found.'}
                    </td>
                  </tr>
                )}
                {filteredIdentities.map((identity, index) => {
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
                            <FiCheckSquare className="h-4.5 w-4.5 text-[#8AB4F8]" />
                          ) : (
                            <FiSquare className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </td>
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
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(identity)}
                          className="text-[#669DF6] hover:text-[#AECBFA] transition-colors"
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
        <div className="gcloud-card mx-4 mb-4 p-8 text-center text-[#9aa0a6]">
          Roles management coming soon.
        </div>
      )}

      {isAddOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeAddModal}
        >
          <div
            className="bg-[#131314] border border-[#3c4043] rounded-lg shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c4043]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#669DF6]/20 flex items-center justify-center">
                  <FiUserPlus className="w-5 h-5 text-[#8ab4f8]" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-[#e8eaed]">Add Identity</h2>
                  <p className="text-xs text-[#9aa0a6]">Register a new identity for Signal-X IAM</p>
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

            <form onSubmit={handleAddIdentity} className="p-6 space-y-5">
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
                  className="w-full px-4 py-3 rounded-lg border border-[#3c4043] bg-[#202124] text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="add-password"
                  className="block text-sm font-medium text-[#e8eaed] mb-2"
                >
                  Password
                </label>
                <input
                  id="add-password"
                  type="password"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-[#3c4043] bg-[#202124] text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                  autoComplete="new-password"
                  required
                />
              </div>

              {addError && <p className="text-sm text-[#f28b82]">{addError}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={addLoading}
                  className="px-4 py-2 text-sm text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043] rounded-md transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading || !addUsername.trim() || !addPassword.trim()}
                  className="px-4 py-2 text-sm bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {addLoading ? 'Creating...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingIdentity && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeEditModal}
        >
          <div
            className="bg-[#131314] border border-[#3c4043] rounded-lg shadow-2xl w-full max-w-md"
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
                  className="w-full px-4 py-3 rounded-lg border border-[#3c4043] bg-[#202124] text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="edit-role"
                  className="block text-sm font-medium text-[#e8eaed] mb-2"
                >
                  Role
                </label>
                <select
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[#3c4043] bg-[#202124] text-[#e8eaed] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="edit-password"
                  className="block text-sm font-medium text-[#e8eaed] mb-2"
                >
                  New Password <span className="text-[#9aa0a6] font-normal">(optional)</span>
                </label>
                <input
                  id="edit-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full px-4 py-3 rounded-lg border border-[#3c4043] bg-[#202124] text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                  autoComplete="new-password"
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
                  disabled={editLoading || !editUsername.trim()}
                  className="px-4 py-2 text-sm bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] font-medium rounded-md transition-colors disabled:opacity-50"
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
