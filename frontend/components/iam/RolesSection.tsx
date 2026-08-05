'use client'

import IdentityLocationPicker from '@/components/iam/IdentityLocationPicker'
import {
  createRole,
  deleteRoles,
  getRoles,
  updateRole,
  type IamRole,
} from '@/lib/api'
import {
  getViewLocationFilter,
  isAddLocationReady,
  resolveIdentityLocation,
} from '@/lib/iamLocation'
import { IAM_SERVICES, serviceLabel } from '@/lib/iamServices'
import React, { useCallback, useEffect, useState } from 'react'
import { FaCheckSquare } from 'react-icons/fa'
import {
  FiCheck,
  FiCopy,
  FiEdit2,
  FiEye,
  FiMinus,
  FiPlus,
  FiSquare,
  FiX,
} from 'react-icons/fi'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function originText(role: IamRole) {
  return role.locationPath || role.locationLabel || 'India'
}

function rolePathFromLocation(role: IamRole): string[] {
  if (!role.locationPath || role.locationPath === 'India' || role.locationScope === 'national') {
    return []
  }
  return role.locationPath.split('/').filter(Boolean)
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

type RoleDraft = {
  title: string
  description: string
  services: string[]
}

const emptyDraft = (): RoleDraft => ({
  title: '',
  description: '',
  services: [],
})

type RolesSectionProps = {
  refreshToken?: number
  pathSegments: string[]
}

export default function RolesSection({
  refreshToken = 0,
  pathSegments,
}: RolesSectionProps) {
  const [roles, setRoles] = useState<IamRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [panelMode, setPanelMode] = useState<'create' | 'edit' | 'view' | null>(null)
  const [editingRole, setEditingRole] = useState<IamRole | null>(null)
  const [draft, setDraft] = useState<RoleDraft>(emptyDraft())
  const [locPath, setLocPath] = useState<string[]>([])
  const [locUseGlobal, setLocUseGlobal] = useState(false)
  const [panelError, setPanelError] = useState('')
  const [panelLoading, setPanelLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)

  const isReadOnly = panelMode === 'view'
  const pathKey = pathSegments.join('/')

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const filter = getViewLocationFilter(pathSegments)
      const response = await getRoles(filter)
      setRoles(response.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }, [pathKey])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles, refreshToken])

  const customSelected = Array.from(selectedIds).filter((id) => {
    const role = roles.find((r) => r.id === id)
    return role?.roleType === 'custom'
  })

  const allSelectable = roles.filter((r) => r.roleType === 'custom')
  const allSelected =
    allSelectable.length > 0 && allSelectable.every((r) => selectedIds.has(r.id))

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        allSelectable.forEach((r) => next.delete(r.id))
      } else {
        allSelectable.forEach((r) => next.add(r.id))
      }
      return next
    })
  }

  const toggleSelectOne = (role: IamRole) => {
    if (role.roleType === 'predefined') return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(role.id)) next.delete(role.id)
      else next.add(role.id)
      return next
    })
  }

  const openCreate = () => {
    setEditingRole(null)
    setDraft(emptyDraft())
    setLocPath([...pathSegments])
    setLocUseGlobal(false)
    setPanelError('')
    setPanelMode('create')
  }

  const openEdit = (role: IamRole) => {
    if (role.roleType === 'predefined') return
    setEditingRole(role)
    setDraft({
      title: role.title,
      description: role.description,
      services: [...role.services],
    })
    const rolePath = rolePathFromLocation(role)
    const isGlobalForBase =
      (pathSegments.length === 0 && role.locationScope === 'national') ||
      (pathSegments.length === 1 && role.locationScope === 'state') ||
      (pathSegments.length >= 2 &&
        pathSegments.length <= 3 &&
        role.locationScope === 'city')
    setLocPath(rolePath.length > 0 ? rolePath : [...pathSegments])
    setLocUseGlobal(isGlobalForBase)
    setPanelError('')
    setPanelMode('edit')
  }

  const openView = (role: IamRole) => {
    setEditingRole(role)
    setDraft({
      title: role.title,
      description: role.description,
      services: [...role.services],
    })
    setLocPath(rolePathFromLocation(role))
    setLocUseGlobal(role.locationScope === 'national')
    setPanelError('')
    setPanelMode('view')
  }

  const closePanel = () => {
    if (panelLoading) return
    setPanelMode(null)
    setEditingRole(null)
    setPanelError('')
  }

  const toggleService = (serviceId: string) => {
    if (isReadOnly) return
    setDraft((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (panelMode === 'view') return
    if (!draft.title.trim()) {
      setPanelError('Title is required')
      return
    }
    if (!isAddLocationReady(locPath, pathSegments, locUseGlobal)) {
      setPanelError(
        pathSegments.length >= 4
          ? 'Location is fixed to the current square'
          : 'Select a deeper location path or enable Global scope'
      )
      return
    }
    const resolved = resolveIdentityLocation(locPath, pathSegments, locUseGlobal)
    if (resolved.error || !resolved.location) {
      setPanelError(resolved.error || 'Invalid location')
      return
    }

    setPanelLoading(true)
    setPanelError('')
    try {
      if (panelMode === 'create') {
        await createRole({
          title: draft.title.trim(),
          description: draft.description.trim(),
          services: draft.services,
          location: resolved.location,
        })
      } else if (panelMode === 'edit' && editingRole) {
        await updateRole({
          id: editingRole.id,
          title: draft.title.trim(),
          description: draft.description.trim(),
          services: draft.services,
          location: resolved.location,
        })
      }
      closePanel()
      await fetchRoles()
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : 'Failed to save role')
    } finally {
      setPanelLoading(false)
    }
  }

  const handleRemove = async () => {
    if (customSelected.length === 0) return
    setRemoveLoading(true)
    try {
      await deleteRoles(customSelected)
      setSelectedIds(new Set())
      await fetchRoles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove roles')
    } finally {
      setRemoveLoading(false)
    }
  }

  const canSave =
    !!draft.title.trim() &&
    (isReadOnly || isAddLocationReady(locPath, pathSegments, locUseGlobal))

  return (
    <div className="relative">
      <div className="flex w-full px-4 h-14 items-center">
        <div className="flex items-center">
          <div
            className="group flex items-center gap-1 px-3 justify-center rounded-sm transition-all cursor-pointer hover:bg-[#202124]"
            onClick={openCreate}
          >
            <FiPlus className="h-4 w-4 text-[#8AB4F8] group-hover:text-[#AECBFA]" />
            <button
              type="button"
              className="py-2 font-medium text-sm transition-all text-[#8AB4F8] group-hover:text-[#AECBFA] shadow-lg"
            >
              Create Custom Role
            </button>
          </div>
          <div
            className={`group flex items-center gap-1 px-3 justify-center rounded-sm transition-all ${
              customSelected.length > 0
                ? 'cursor-pointer hover:bg-[#202124]'
                : 'cursor-not-allowed opacity-60'
            }`}
            onClick={() => {
              if (customSelected.length > 0) handleRemove()
            }}
          >
            <FiMinus
              className={`h-4 w-4 ${
                customSelected.length > 0
                  ? 'text-[#8AB4F8] group-hover:text-[#AECBFA]'
                  : 'text-[#e8eaed61]'
              }`}
            />
            <button
              type="button"
              disabled={customSelected.length === 0 || removeLoading}
              className={`py-2 font-medium text-sm transition-all shadow-lg disabled:cursor-not-allowed ${
                customSelected.length > 0
                  ? 'text-[#8AB4F8] group-hover:text-[#AECBFA]'
                  : 'text-[#e8eaed61]'
              }`}
            >
              {removeLoading ? 'Removing...' : 'Remove Role'}
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
                    className="text-[#9aa0a6] hover:text-[#8AB4F8] transition-colors"
                    aria-label={allSelected ? 'Deselect all custom roles' : 'Select all custom roles'}
                  >
                    {allSelected ? (
                      <FaCheckSquare className="h-4.5 w-4.5 text-[#8AB4F8]" />
                    ) : (
                      <FiSquare className="h-4.5 w-4.5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  Title
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  Services
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  Role Type
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  Origin
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]">
                  Create Date & Time
                </th>
                <th className="px-4 py-2 text-left text-md font-medium text-[#5f6368] dark:text-[#e8eaed]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dadce0] dark:divide-[#3c4043]">
              {!loading && roles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#9aa0a6]">
                    No roles found for this location.
                  </td>
                </tr>
              )}
              {roles.map((role) => {
                const isSelected = selectedIds.has(role.id)
                const isPredefined = role.roleType === 'predefined'
                const origin = originText(role)
                return (
                  <tr
                    key={role.id}
                    className={`hover:bg-[#202124]/50 transition-colors ${
                      isSelected ? 'bg-[#8AB4F8]/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(role)}
                        disabled={isPredefined}
                        className={`transition-colors ${
                          isPredefined
                            ? 'text-[#5f6368]/50 cursor-not-allowed'
                            : 'text-[#9aa0a6] hover:text-[#8AB4F8]'
                        }`}
                        title={
                          isPredefined
                            ? 'Predefined roles cannot be selected for removal'
                            : isSelected
                              ? 'Deselect role'
                              : 'Select role'
                        }
                        aria-label={
                          isPredefined
                            ? 'Predefined role'
                            : isSelected
                              ? 'Deselect role'
                              : 'Select role'
                        }
                      >
                        {isSelected ? (
                          <FaCheckSquare className="h-4.5 w-4.5 text-[#8AB4F8]" />
                        ) : (
                          <FiSquare className="h-4.5 w-4.5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#e8eaed] font-medium">{role.title}</td>
                    <td className="px-4 py-3 text-sm text-[#9aa0a6]">
                      <div className="flex flex-wrap gap-0.5 max-w-md">
                        {role.services.length === 0 ? (
                          <span className="text-[#5f6368]">None</span>
                        ) : (
                          role.services.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded text-[13px] underline decoration-0.5 underline-offset-3 text-[#AECBFA]"
                            >
                              {serviceLabel(s)}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded text-sm font-mono capitalize ${
                          isPredefined ? 'text-[#e8eaed]' : 'text-[#8AB4F8]'
                        }`}
                      >
                        {isPredefined ? 'Predefined' : 'Custom'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9aa0a6]">
                      <span className="inline-flex items-center gap-2">
                        <span className="truncate max-w-[220px]" title={origin}>
                          {origin}
                        </span>
                        <CopyButton value={origin} label="location path" />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9aa0a6]">
                      {formatDateTime(role.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isPredefined ? (
                        <button
                          type="button"
                          onClick={() => openView(role)}
                          className="text-[#8AB4F8] hover:text-[#AECBFA] transition-colors"
                          title="View role"
                          aria-label={`View ${role.title}`}
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEdit(role)}
                          className="text-[#8AB4F8] hover:text-[#AECBFA] transition-colors"
                          title="Edit role"
                          aria-label={`Edit ${role.title}`}
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {panelMode && (
        <>
          <div className="fixed inset-0 z-[2000] bg-black/40" onClick={closePanel} />
          <aside className="fixed top-0 right-0 z-[2001] h-full w-full max-w-xl bg-[#131314] border-l border-[#3c4043] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#3c4043]">
              <div>
                <h2 className="text-lg font-medium text-[#e8eaed]">
                  {panelMode === 'create'
                    ? 'Create Role'
                    : panelMode === 'view'
                      ? 'View Role'
                      : 'Edit Role'}
                </h2>
                <p className="text-xs text-[#9aa0a6] mt-0.5">
                  {panelMode === 'create'
                    ? 'Define a custom role, origin, and services'
                    : panelMode === 'view'
                      ? 'Predefined role — India scope, read only'
                      : editingRole?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="text-[#9aa0a6] hover:text-[#e8eaed] p-1.5 rounded-md hover:bg-[#3c4043]"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#e8eaed] mb-2">Title</label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="Unique role title"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2.5 rounded-lg border border-[#3c4043] bg-[#202124] text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#8AB4F8] ${
                    isReadOnly ? 'opacity-80 cursor-default' : ''
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                  Description
                </label>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={3}
                  placeholder="What this role can do"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2.5 rounded-lg border border-[#3c4043] bg-[#202124] text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#8AB4F8] resize-none ${
                    isReadOnly ? 'opacity-80 cursor-default' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e8eaed] mb-2">Origin</label>
                {isReadOnly ? (
                  <div className="px-3 py-2.5 rounded-lg border border-[#3c4043] bg-[#202124] text-sm text-[#e8eaed]">
                    {editingRole ? originText(editingRole) : 'India'}
                  </div>
                ) : (
                  <IdentityLocationPicker
                    lockedBase={pathSegments}
                    path={locPath}
                    onPathChange={setLocPath}
                    useGlobal={locUseGlobal}
                    onUseGlobalChange={setLocUseGlobal}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e8eaed] mb-2">Services</label>
                <div className="space-y-1.5 max-h-72 overflow-y-auto rounded-lg border border-[#3c4043] p-2 bg-[#0f0f10]">
                  {IAM_SERVICES.map((service) => {
                    const checked = draft.services.includes(service.id)
                    return (
                      <label
                        key={service.id}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                          isReadOnly
                            ? 'cursor-default'
                            : checked
                              ? 'bg-[#8AB4F8]/10 cursor-pointer'
                              : 'hover:bg-[#202124] cursor-pointer'
                        } ${checked && isReadOnly ? 'bg-[#8AB4F8]/10' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleService(service.id)}
                          disabled={isReadOnly}
                          className="rounded border-[#5f6368] bg-[#131314] text-[#8AB4F8] focus:ring-[#8AB4F8] disabled:opacity-70"
                        />
                        <span className="text-sm text-[#e8eaed]">{service.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {panelError && <p className="text-sm text-[#f28b82]">{panelError}</p>}
            </form>

            <div className="px-5 py-4 border-t border-[#3c4043] flex justify-end gap-2">
              {isReadOnly ? (
                <button
                  type="button"
                  onClick={closePanel}
                  className="px-4 py-2 text-sm bg-[#8AB4F8] hover:bg-[#aecbfa] text-[#202124] font-medium rounded-md transition-colors"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={closePanel}
                    disabled={panelLoading}
                    className="px-4 py-2 text-sm text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043] rounded-md transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={panelLoading || !canSave}
                    className="px-4 py-2 text-sm bg-[#8AB4F8] hover:bg-[#aecbfa] text-[#202124] font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    {panelLoading ? 'Saving...' : panelMode === 'create' ? 'Create' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
